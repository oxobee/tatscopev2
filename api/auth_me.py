import os
import json
import jwt
from pymongo import MongoClient

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
    auth = request.headers.get("authorization") or request.headers.get("Authorization") if hasattr(request, 'headers') else None
    if not auth:
        return json_response({"error": "missing auth"}, status=401)
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]
    else:
        token = auth
    try:
        payload = jwt.decode(token, JWT_SECRET or "", algorithms=["HS256"])
    except Exception:
        return json_response({"error": "invalid token"}, status=401)
    user = None
    if db:
        user = db.users.find_one({"user_id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        return json_response({"error": "user not found"}, status=404)
    return json_response(user)
