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
def _do_me(auth_header):
    if not auth_header:
        return 401, {"error": "missing auth"}
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        token = auth_header
    try:
        import jwt
    except Exception:
        return 500, {"error": "server missing dependencies"}
    JWT_SECRET = os.environ.get("JWT_SECRET")
    try:
        payload = jwt.decode(token, JWT_SECRET or "", algorithms=["HS256"])
    except Exception:
        return 401, {"error": "invalid token"}
    db = _get_db()
    user = None
    if db:
        user = db.users.find_one({"user_id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        return 404, {"error": "user not found"}
    return 200, user


def handler(request):
    headers = getattr(request, 'headers', {})
    auth = None
    if headers:
        auth = headers.get("authorization") or headers.get("Authorization")
    status, data = _do_me(auth)
    return json_response(data, status=status)
