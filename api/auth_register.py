import os
import json
from hashlib import sha256
from http import HTTPStatus
from pymongo import MongoClient
import bcrypt
import jwt

# Global Mongo client to be reused across invocations
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
JWT_SECRET = os.environ.get("JWT_SECRET")
client = MongoClient(MONGO_URL) if MONGO_URL else None
db = client[DB_NAME] if client and DB_NAME else None

def json_response(obj, status=200):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(obj),
    }

def handler(request):
    try:
        body = json.loads(request.body.decode()) if hasattr(request, 'body') else json.loads(request.get_data())
    except Exception:
        return json_response({"error": "invalid json"}, status=400)
    email = (body.get("email") or "").lower().strip()
    password = body.get("password")
    name = body.get("name") or email.split("@")[0]
    role = body.get("role") or "user"
    if not email or not password:
        return json_response({"error": "email and password required"}, status=400)
    if not db:
        return json_response({"error": "database not configured"}, status=500)
    existing = db.users.find_one({"email": email})
    if existing:
        return json_response({"error": "email exists"}, status=400)
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
    token = jwt.encode({"sub": user_id, "email": email}, JWT_SECRET or "", algorithm="HS256")
    return json_response({"user_id": user_id, "email": email, "access_token": token}, status=201)
