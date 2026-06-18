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
def _do_login(body):
    email = (body.get("email") or "").lower().strip()
    password = body.get("password")
    if not email or not password:
        return 400, {"error": "email and password required"}
    db = _get_db()
    if not db:
        return 500, {"error": "database not configured"}
    user = db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        return 401, {"error": "invalid credentials"}
    try:
        import bcrypt
    except Exception:
        return 500, {"error": "server missing dependencies"}
    try:
        ok = bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8"))
    except Exception:
        ok = False
    if not ok:
        return 401, {"error": "invalid credentials"}
    try:
        import jwt
    except Exception:
        return 500, {"error": "server missing dependencies"}
    JWT_SECRET = os.environ.get("JWT_SECRET")
    token = jwt.encode({"sub": user["user_id"], "email": email}, JWT_SECRET or "", algorithm="HS256")
    return 200, {"user_id": user["user_id"], "email": email, "access_token": token}


def handler(request):
    try:
        raw = request.body if hasattr(request, 'body') else request.get_data()
        if isinstance(raw, bytes):
            body = json.loads(raw.decode())
        else:
            body = json.loads(raw)
    except Exception:
        return json_response({"error": "invalid json"}, status=400)
    status, data = _do_login(body)
    return json_response(data, status=status)
