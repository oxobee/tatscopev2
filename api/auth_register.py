import os
import json
from hashlib import sha256


def json_response(obj, status=200):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(obj),
    }


_client = None
_db = None


def _get_db():
    global _client, _db
    if _client and _db:
        return _db
    try:
        import pymongo
    except Exception:
        return None
    MONGO_URL = os.environ.get("MONGO_URL")
    DB_NAME = os.environ.get("DB_NAME")
    if not MONGO_URL or not DB_NAME:
        return None
    _client = pymongo.MongoClient(MONGO_URL)
    _db = _client[DB_NAME]
    return _db


def _do_register(body):
    email = (body.get("email") or "").lower().strip()
    password = body.get("password")
    name = body.get("name") or email.split("@")[0]
    role = body.get("role") or "user"
    if not email or not password:
        return 400, {"error": "email and password required"}
    db = _get_db()
    if not db:
        return 500, {"error": "database not configured"}
    existing = db.users.find_one({"email": email})
    if existing:
        return 400, {"error": "email exists"}
    try:
        import bcrypt
        import jwt
    except Exception:
        return 500, {"error": "server missing dependencies"}
    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = "u_" + sha256(email.encode()).hexdigest()[:14]
    doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": pw_hash,
        "name": name,
        "role": role,
        "created_at": None,
    }
    db.users.insert_one(doc)
    JWT_SECRET = os.environ.get("JWT_SECRET")
    token = jwt.encode({"sub": user_id, "email": email}, JWT_SECRET or "", algorithm="HS256")
    return 201, {"user_id": user_id, "email": email, "access_token": token}


try:
    # Optional Flask WSGI app for Vercel detection
    from flask import Flask, request, jsonify

    app = Flask(__name__)


    @app.route('/', methods=['POST'])
    @app.route('/<path:_>', methods=['POST'])
    def flask_handler(_path=""):
        try:
            if hasattr(request, 'body'):
                raw = request.body
                if isinstance(raw, bytes):
                    body = json.loads(raw.decode())
                else:
                    body = json.loads(raw)
            else:
                body = json.loads(request.get_data())
        except Exception:
            return jsonify({"error": "invalid json"}), 400
        status, data = _do_register(body)
        return (jsonify(data), status)
except Exception:
    app = None


def handler(request):
    # Vercel serverless entrypoint
    try:
        raw = request.body if hasattr(request, 'body') else request.get_data()
        if isinstance(raw, bytes):
            body = json.loads(raw.decode())
        else:
            body = json.loads(raw)
    except Exception:
        return json_response({"error": "invalid json"}, status=400)
    status, data = _do_register(body)
    return json_response(data, status=status)
