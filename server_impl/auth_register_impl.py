import os
import json
from hashlib import sha256


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


def do_register(body):
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
