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


from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/', methods=['GET'])
@app.route('/<path:_>', methods=['GET'])
def handler():
    headers = request.headers
    auth = headers.get("authorization") or headers.get("Authorization")
    if not auth:
        return jsonify({"error": "missing auth"}), 401
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]
    else:
        token = auth
    try:
        import jwt
    except Exception:
        return jsonify({"error": "server missing dependencies"}), 500
    JWT_SECRET = os.environ.get("JWT_SECRET")
    try:
        payload = jwt.decode(token, JWT_SECRET or "", algorithms=["HS256"])
    except Exception:
        return jsonify({"error": "invalid token"}), 401
    db = _get_db()
    user = None
    if db:
        user = db.users.find_one({"user_id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify(user)
