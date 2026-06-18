import os
import json


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


def handler(request):
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
        return json_response({"error": "invalid json"}, status=400)
    email = (body.get("email") or "").lower().strip()
    password = body.get("password")
    if not email or not password:
        return json_response({"error": "email and password required"}, status=400)
    db = _get_db()
    if not db:
        return json_response({"error": "database not configured"}, status=500)
    user = db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        return json_response({"error": "invalid credentials"}, status=401)
    try:
        import bcrypt
    except Exception:
        return json_response({"error": "server missing dependencies"}, status=500)
    try:
        ok = bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8"))
    except Exception:
        ok = False
    if not ok:
        return json_response({"error": "invalid credentials"}, status=401)
    try:
        import jwt
    except Exception:
        return json_response({"error": "server missing dependencies"}, status=500)
    JWT_SECRET = os.environ.get("JWT_SECRET")
    token = jwt.encode({"sub": user["user_id"], "email": email}, JWT_SECRET or "", algorithm="HS256")
    return json_response({"user_id": user["user_id"], "email": email, "access_token": token})
