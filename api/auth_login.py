import os
import json
from http import HTTPStatus
from pymongo import MongoClient
import bcrypt
import jwt

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
    if not email or not password:
        return json_response({"error": "email and password required"}, status=400)
    if not db:
        return json_response({"error": "database not configured"}, status=500)
    user = db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        return json_response({"error": "invalid credentials"}, status=401)
    try:
        ok = bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8"))
    except Exception:
        ok = False
    if not ok:
        return json_response({"error": "invalid credentials"}, status=401)
    token = jwt.encode({"sub": user["user_id"], "email": email}, JWT_SECRET or "", algorithm="HS256")
    return json_response({"user_id": user["user_id"], "email": email, "access_token": token})
