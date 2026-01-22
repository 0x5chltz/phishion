from flask import Flask, redirect, request, url_for, jsonify, make_response, session
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
from sqlalchemy import func
from os import environ
from datetime import datetime, date
import requests

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
    scans = db.relationship('Scan', backref='user')

    def json(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

class Scan(db.Model):
    __tablename__ = 'scans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    scanned_url = db.Column(db.Text, nullable=False)
    scanned_at = db.Column(db.DateTime, default=datetime.now)

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
    token = google.authorize_access_token()
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
    session['oauth_token'] = token

    return redirect("http://localhost:3000/dashboard")

# route to logout user
@app.route('/api/logout', methods=['POST'])
@cross_origin(supports_credentials=True)
def logout_user():
    session.clear()
    return redirect("http://localhost:3000/")

# route to get user info
@app.route('/api/userinfo', methods=['GET'])
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

# route to scan a URL using VirusTotal API
@app.route('/api/scan', methods=['POST'])
@cross_origin(supports_credentials=True)
def scan_url():
    try:
        data = request.get_json()
        url_to_scan = data.get('url')

        email = session.get('user_email')
        username = session.get('username')

        app.logger.info(f"Request received from session: email={email}, username={username}, url={url_to_scan}")

        if not email or not username:
            return jsonify({"error": "User not authenticated, please log in"}), 401
        if not url_to_scan:
            return jsonify({"error": "Missing URL"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, username=username)
            db.session.add(user)
            db.session.commit()

        today = date.today()
        scan_count = Scan.query.filter(
            Scan.user_id == user.id,
            func.date(Scan.scanned_at) == today
        ).count()

        if scan_count >= 5:
            return jsonify({"error": "Daily scan limit reached (5 per day)"}), 429

        response = requests.post(
            'https://www.virustotal.com/api/v3/urls',
            headers={"x-apikey": VIRUSTOTAL_API_KEY},
            data={"url": url_to_scan}
        )

        if response.status_code != 200:
            return jsonify({"error": "Failed to submit URL"}), 500

        scan_result = response.json()
        raw_id = scan_result.get("data", {}).get("id")
        if not raw_id or '-' not in raw_id:
            return jsonify({"error": "Invalid response from VirusTotal"}), 500

        url_id = raw_id.split('-')[1]

        new_scan = Scan(user_id=user.id, scanned_url=url_to_scan)
        db.session.add(new_scan)
        db.session.commit()

        return fetch_scan_result(url_id, remaining=5 - scan_count)

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
        
        today = date.today()
        scan_count = Scan.query.filter(
            Scan.user_id == user.id,
            func.date(Scan.scanned_at) == today
        ).count()

        return fetch_scan_result(url_id, remaining=5 - scan_count)

    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)

# function to fetch scan result from VirusTotal
@cross_origin(supports_credentials=True)
def fetch_scan_result(url_id, remaining=None):
    try:
        vt_result = requests.get(
            f'https://www.virustotal.com/api/v3/urls/{url_id}',
            headers={
                "x-apikey": VIRUSTOTAL_API_KEY
            }
        )
        if vt_result.status_code != 200:
            return jsonify({"error": "Failed to retrieve scan result"}), 500
        
        result = vt_result.json()

        response = {
            "url_id": url_id,
            "scan_result": result
        }

        if remaining is not None:
            response["remaining"] = remaining

        return jsonify(response)
    
    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)


with app.app_context():
    db.create_all()
