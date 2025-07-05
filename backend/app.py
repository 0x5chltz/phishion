from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from os import environ
import requests

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def json(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

# root route for the API
@app.route('/api', methods=['GET'])
def index():
    return jsonify({"message": "Welcome to the Flask API!"})

# route to create a new user
@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        new_user = User(
            username=data.get('username'),
            email=data.get('email')
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify(new_user.json())
    
    except Exception as e:
        db.session.rollback()
        return make_response(jsonify({"error": str(e)}), 500)
    
# route to get all users
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return jsonify([user.json() for user in users])

    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)

# route to get a user by ID
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        if user:
            return jsonify(user.json())
        return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)

# route to delete a user by ID
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        if user:
            db.session.delete(user)
            db.session.commit()
            return jsonify({"message": "User deleted successfully"}), 204
        return jsonify({"error": "User not found"}), 404

    except Exception as e:
        db.session.rollback()
        return make_response(jsonify({"error": str(e)}), 500)

# Virus total API
url = "https://www.virustotal.com/api/v3/urls"

headers = {
    "accept": "application/json",
    "x-apikey": environ.get('VIRUSTOTAL_API_KEY')
}
@app.route('/api/scan', methods=['POST'])
def scan_url():
    try:
        data = request.get_json()
        url_to_scan = data.get('url')
        if not url_to_scan:
            return make_response(jsonify({"error": "URL is required"}), 400)

        response = requests.post(url, headers=headers, json={"url": url_to_scan})
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return make_response(jsonify({"error": "Failed to scan URL"}), response.status_code)

    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 500)

with app.app_context():
    db.create_all()