from flask import Flask, redirect, request, url_for, jsonify, make_response, session
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
from os import environ
from datetime import datetime, date, time, timedelta
import requests

try:
    from .validators import is_valid_hostname, is_valid_scan_url, normalize_hostname
except ImportError:
    # Docker copies backend/ as the application root.
    from validators import is_valid_hostname, is_valid_scan_url, normalize_hostname

try:
    app = Flask(__name__)
    app.secret_key = environ.get('SECRET_KEY')

    app.config['SQLALCHEMY_DATABASE_URI'] = environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    CORS(app, supports_credentials=True)
    db = SQLAlchemy(app)

    oauth = OAuth(app)
    google = oauth.register(
        name='google',
        client_id=environ.get('GOOGLE_CLIENT_ID'),
        client_secret=environ.get('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )
except Exception as e:
    print(f"Error during app initialization: {str(e)}")
    raise e

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    scans = db.relationship('Scan', backref='user', cascade='all, delete-orphan')

    def json(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

scan_user_scanned_at_index = db.Index(
    'ix_scans_user_scanned_at', 'user_id', 'scanned_at'
)


class Scan(db.Model):
    __tablename__ = 'scans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    scanned_url = db.Column(db.Text, nullable=False)
    scanned_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    __table_args__ = (scan_user_scanned_at_index,)


def daily_scan_count(user_id):
    """Count today's scans with an index-friendly timestamp range."""
    start = datetime.combine(date.today(), time.min)
    end = start + timedelta(days=1)
    return Scan.query.filter(
        Scan.user_id == user_id,
        Scan.scanned_at >= start,
        Scan.scanned_at < end,
    ).count()

# root route for the API
@app.route('/api', methods=['GET'])
def index():
    return jsonify({"message": "Welcome to the Flask API!"})

# OAuth routes for Google login
@app.route('/login/google')
def login_google():
    try:
        redirect_uri = url_for('authorize_google', _external=True)
        return google.authorize_redirect(redirect_uri)
    except Exception as e:
        app.logger.error(f"Error during Google login: {str(e)}")
        return make_response(jsonify({"error": str(e)}), 500)
    
@app.route('/callback/google')
def authorize_google():
    google.authorize_access_token()
    userinfo_endpoint = google.server_metadata['userinfo_endpoint']
    resp = google.get(userinfo_endpoint)
    user_info = resp.json()
    username = user_info['email'].split('@')[0]
    email = user_info['email']

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=username, email=email)
        db.session.add(user)
        db.session.commit()

    session['username'] = username
    session['user_email'] = email
    return redirect("http://localhost:3000/dashboard")

# route to logout user
@app.route('/api/logout', methods=['POST'])
@cross_origin(supports_credentials=True)
def logout_user():
    session.clear()
    return redirect("http://localhost:3000/")

# route to get user info
@app.route('/api/userinfo', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_userinfo():
    username = session.get('username')
    email = session.get('user_email')

    if not username or not email:
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({
        "username": username,
        "email": email
    })

# route to delete account
@app.route('/api/delete', methods=['POST'])
@cross_origin(supports_credentials=True)
def logout():
    try:
        email = session.get('user_email')

        if email:
            user = User.query.filter_by(email=email).first()
            if user:
                db.session.delete(user)
                db.session.commit()

        session.clear()

        return jsonify({"message": "Logged out successfully"}), 200

    except Exception as e:
        app.logger.exception("Logout failed")
        return jsonify({"error": "Logout failed", "details": str(e)}), 500

# Virus total API
VIRUSTOTAL_API_KEY = environ.get('VIRUSTOTAL_API_KEY')
if not VIRUSTOTAL_API_KEY:
    raise ValueError("VIRUSTOTAL_API_KEY environment variable is not set")

# timeout (seconds) applied to every outbound threat-intelligence request
EXTERNAL_HTTP_TIMEOUT = 15

# route to scan a URL using VirusTotal API
@app.route('/api/scan', methods=['POST'])
@cross_origin(supports_credentials=True)
def scan_url():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400

        url_to_scan = data.get('url')

        email = session.get('user_email')
        username = session.get('username')

        app.logger.info(f"Request received from session: email={email}, username={username}, url={url_to_scan}")

        if not email or not username:
            return jsonify({"error": "User not authenticated, please log in"}), 401
        if not is_valid_scan_url(url_to_scan):
            return jsonify({"error": "A valid HTTP(S) URL is required"}), 400
        url_to_scan = url_to_scan.strip()

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, username=username)
            db.session.add(user)
            db.session.commit()

        scan_count = daily_scan_count(user.id)

        if scan_count >= 5:
            return jsonify({"error": "Daily scan limit reached (5 per day)"}), 429

        try:
            response = requests.post(
                'https://www.virustotal.com/api/v3/urls',
                headers={"x-apikey": VIRUSTOTAL_API_KEY},
                data={"url": url_to_scan},
                timeout=EXTERNAL_HTTP_TIMEOUT
            )
        except requests.RequestException as e:
            app.logger.error(f"VirusTotal submit request failed: {str(e)}")
            return jsonify({"error": "VirusTotal service unavailable"}), 502

        if response.status_code != 200:
            return jsonify({"error": "Failed to submit URL"}), 502

        try:
            scan_result = response.json()
        except ValueError:
            return jsonify({"error": "Invalid response from VirusTotal"}), 502
        raw_id = scan_result.get("data", {}).get("id")
        if not raw_id or '-' not in raw_id:
            return jsonify({"error": "Invalid response from VirusTotal"}), 502

        url_id = raw_id.split('-')[1]

        new_scan = Scan(user_id=user.id, scanned_url=url_to_scan)
        db.session.add(new_scan)
        db.session.commit()

        return fetch_scan_result(url_id, remaining=4 - scan_count)

    except Exception as e:
        app.logger.error(f"Error in scan_url {str(e)}")
        return make_response(jsonify({"error": "Internal Server Error", "details": str(e)}), 500)

# route to get the scan result by ID
@app.route('/api/scan/<url_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_scan_result(url_id):
    try:
        email = session.get('user_email')

        if not email:
            return jsonify({"error": "User not authenticated"}), 401
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        scan_count = daily_scan_count(user.id)

        return fetch_scan_result(url_id, remaining=max(0, 5 - scan_count))

    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)

# function to fetch scan result from VirusTotal
def fetch_scan_result(url_id, remaining=None):
    try:
        try:
            vt_result = requests.get(
                f'https://www.virustotal.com/api/v3/urls/{url_id}',
                headers={
                    "x-apikey": VIRUSTOTAL_API_KEY
                },
                timeout=EXTERNAL_HTTP_TIMEOUT
            )
        except requests.RequestException as e:
            app.logger.error(f"VirusTotal fetch request failed: {str(e)}")
            return jsonify({"error": "VirusTotal service unavailable"}), 502

        if vt_result.status_code != 200:
            return jsonify({"error": "Failed to retrieve scan result"}), 502
        
        try:
            result = vt_result.json()
        except ValueError:
            return jsonify({"error": "Invalid response from VirusTotal"}), 502

        response = {
            "url_id": url_id,
            "scan_result": result
        }

        if remaining is not None:
            response["remaining"] = remaining

        return jsonify(response)
    
    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)

# Security Trails API
SECURITYTRAILS_API_KEY = environ.get('SECURITYTRAILS_API_KEY')
if not SECURITYTRAILS_API_KEY:
    raise ValueError("SECURITYTRAILS_API_KEY environment variable is not set")

# route to get subdomain info using Security Trails API
@app.route('/api/domain/<hostname>', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_subdomain_info(hostname):
    try:
        email = session.get('user_email')
        if not email:
            return jsonify({"error": "User not authenticated"}), 401

        if not is_valid_hostname(hostname):
            return jsonify({"error": "Invalid hostname"}), 400

        normalized_hostname = normalize_hostname(hostname)

        try:
            response = requests.get(
                f'https://api.securitytrails.com/v1/domain/{normalized_hostname}/subdomains',
                headers={
                    "accept": "application/json",
                    "apikey": SECURITYTRAILS_API_KEY
                },
                timeout=EXTERNAL_HTTP_TIMEOUT
            )
        except requests.RequestException as e:
            app.logger.error(f"SecurityTrails request failed: {str(e)}")
            return jsonify({"error": "SecurityTrails service unavailable"}), 502

        if response.status_code == 429:
            return jsonify({"error": "SecurityTrails rate limit reached"}), 429
        if response.status_code == 404:
            return jsonify({"error": "Domain not found"}), 404
        if response.status_code != 200:
            return jsonify({"error": "Failed to retrieve domain info"}), 502

        try:
            domain_info = response.json()
        except ValueError:
            return jsonify({"error": "Invalid response from SecurityTrails"}), 502
        return jsonify(domain_info), 200

    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)
    
with app.app_context():
    db.create_all()
    scan_user_scanned_at_index.create(bind=db.engine, checkfirst=True)
