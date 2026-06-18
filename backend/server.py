"""TattooMatch backend - FastAPI + MongoDB.

Auth: JWT email/password + Emergent Google OAuth (both share the users collection).
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import bcrypt
import jwt
import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Literal
from collections import Counter, defaultdict

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------- Config ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("tattoomatch")

app = FastAPI(title="TatScope API")
api = APIRouter(prefix="/api")


# ---------- Helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), h.encode("utf-8"))
    except Exception:
        return False


def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now_utc() + timedelta(minutes=60 * 24),  # 24h
        "type": "access",
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": now_utc() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: Optional[str] = None):
    response.set_cookie(
        "access_token", access, httponly=True, secure=True, samesite="none",
        max_age=60 * 60 * 24, path="/",
    )
    if refresh:
        response.set_cookie(
            "refresh_token", refresh, httponly=True, secure=True, samesite="none",
            max_age=60 * 60 * 24 * 7, path="/",
        )


def clean_user(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


async def _resolve_user_from_jwt(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        return user
    except jwt.PyJWTError:
        return None


async def _resolve_user_from_session(token: str) -> Optional[dict]:
    """Emergent OAuth session_token lookup."""
    sess = await db.sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < now_utc():
        return None
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
    return user


async def get_current_user(request: Request) -> dict:
    # Try JWT access token first
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        user = await _resolve_user_from_jwt(token)
        if user:
            return user
    # Fallback to Emergent session token
    sess_token = request.cookies.get("session_token")
    if not sess_token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            sess_token = auth[7:]
    if sess_token:
        user = await _resolve_user_from_session(sess_token)
        if user:
            return user
    raise HTTPException(status_code=401, detail="Yetkilendirilmedi")


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


# ---------- Models ----------
Role = Literal["user", "artist"]


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    role: Role = "user"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    role: Role
    picture: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    instagram: Optional[str] = None
    contact: Optional[str] = None
    studio_name: Optional[str] = None
    auth_provider: str = "password"
    created_at: Optional[str] = None


class ArtistUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    instagram: Optional[str] = None
    contact: Optional[str] = None
    studio_name: Optional[str] = None
    picture: Optional[str] = None
    phone: Optional[str] = None
    birthday: Optional[str] = None


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class ReviewIn(BaseModel):
    text: Optional[str] = Field(default=None, max_length=800)
    stars: Optional[int] = Field(default=None, ge=1, le=5)
    photo: Optional[str] = None  # base64 image, optional


class VerifyClientIn(BaseModel):
    email: EmailStr


class MessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class TattooIn(BaseModel):
    image: str  # base64 data URL
    description: str = ""
    tags: List[str] = []
    style: str = "minimal"  # minimal, blackwork, traditional, realism, geometric, fineline, watercolor
    color: Literal["black", "color"] = "black"
    size: Literal["small", "medium", "large"] = "medium"


class CommentIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class RatingIn(BaseModel):
    stars: int = Field(ge=1, le=5)


# ---------- Auth Endpoints ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    user_id = f"u_{uuid.uuid4().hex[:14]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name.strip(),
        "role": body.role,
        "username": None,
        "picture": None,
        "bio": None,
        "location": None,
        "instagram": None,
        "contact": None,
        "studio_name": None,
        "phone": None,
        "birthday": None,
        "auth_provider": "password",
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {**clean_user(doc), "access_token": access}


@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    access = create_access_token(user["user_id"], email)
    refresh = create_refresh_token(user["user_id"])
    set_auth_cookies(response, access, refresh)
    return {**clean_user(user), "access_token": access}


@api.post("/auth/session")
async def emergent_session(request: Request, response: Response):
    """Exchange Emergent session_id for a session_token, create/get user."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id gerekli")
    async with httpx.AsyncClient(timeout=15) as h:
        r = await h.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Emergent oturumu doğrulanamadı")
    data = r.json()
    email = data["email"].lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        user_id = f"u_{uuid.uuid4().hex[:14]}"
        doc = {
            "user_id": user_id,
            "email": email,
            "password_hash": None,
            "name": data.get("name") or email.split("@")[0],
            "role": body.get("role") or "user",
            "picture": data.get("picture"),
            "bio": None, "location": None, "instagram": None,
            "contact": None, "studio_name": None,
            "auth_provider": "google",
            "created_at": now_utc().isoformat(),
        }
        await db.users.insert_one(doc)
        user = doc
    else:
        if not user.get("picture") and data.get("picture"):
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"picture": data["picture"]}})
            user["picture"] = data["picture"]
    # Save session
    expires = now_utc() + timedelta(days=7)
    await db.sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": data["session_token"],
        "expires_at": expires.isoformat(),
        "created_at": now_utc().isoformat(),
    })
    response.set_cookie(
        "session_token", data["session_token"],
        httponly=True, secure=True, samesite="none",
        max_age=60 * 60 * 24 * 7, path="/",
    )
    return clean_user(user)


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    sess = request.cookies.get("session_token")
    if sess:
        await db.sessions.delete_one({"session_token": sess})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    tok = request.cookies.get("refresh_token")
    if not tok:
        raise HTTPException(status_code=401, detail="Refresh token yok")
    try:
        payload = jwt.decode(tok, jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Geçersiz token tipi")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        access = create_access_token(user["user_id"], user["email"])
        set_auth_cookies(response, access)
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Geçersiz refresh token")


# ---------- Artist / Profile Endpoints ----------
@api.get("/artists")
async def list_artists(q: Optional[str] = None, limit: int = 50):
    query = {"role": "artist"}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
            {"studio_name": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.users.find(query, {"_id": 0, "password_hash": 0}).limit(limit)
    artists = await cursor.to_list(length=limit)
    # Attach tattoo counts + follow counts
    for a in artists:
        a["tattoo_count"] = await db.tattoos.count_documents({"artist_id": a["user_id"]})
        a["follower_count"] = await db.follows.count_documents({"artist_id": a["user_id"]})
        ratings = await db.ratings.find({"artist_id": a["user_id"]}, {"_id": 0}).to_list(1000)
        a["rating_avg"] = round(sum(r["stars"] for r in ratings) / len(ratings), 1) if ratings else 0.0
        a["rating_count"] = len(ratings)
    return artists


@api.get("/artists/{artist_id}")
async def get_artist(artist_id: str, viewer=Depends(get_optional_user)):
    a = await db.users.find_one({"user_id": artist_id, "role": "artist"}, {"_id": 0, "password_hash": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Sanatçı bulunamadı")
    tattoos = await db.tattoos.find({"artist_id": artist_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for t in tattoos:
        t["like_count"] = await db.likes.count_documents({"tattoo_id": t["tattoo_id"]})
    follower_count = await db.follows.count_documents({"artist_id": artist_id})
    # Aggregate rating from REVIEWS (preferred) + legacy ratings collection
    reviews = await db.reviews.find({"artist_id": artist_id}, {"_id": 0}).to_list(1000)
    star_reviews = [r for r in reviews if r.get("stars")]
    legacy = await db.ratings.find({"artist_id": artist_id}, {"_id": 0}).to_list(1000)
    all_stars = [r["stars"] for r in star_reviews] + [r["stars"] for r in legacy]
    rating_avg = round(sum(all_stars) / len(all_stars), 1) if all_stars else 0.0
    is_following = False
    my_rating = None
    is_verified_client = False
    if viewer:
        is_following = bool(await db.follows.find_one({"follower_id": viewer["user_id"], "artist_id": artist_id}))
        rdoc = await db.ratings.find_one({"artist_id": artist_id, "user_id": viewer["user_id"]}, {"_id": 0})
        if rdoc:
            my_rating = rdoc["stars"]
        is_verified_client = bool(await db.verified_clients.find_one(
            {"artist_id": artist_id, "user_id": viewer["user_id"]}
        ))
    return {
        "artist": a,
        "tattoos": tattoos,
        "follower_count": follower_count,
        "rating_avg": rating_avg,
        "rating_count": len(all_stars),
        "is_following": is_following,
        "my_rating": my_rating,
        "is_verified_client": is_verified_client,
    }


@api.put("/artists/me")
async def update_artist_profile(body: ArtistUpdate, user=Depends(get_current_user)):
    if user["role"] != "artist":
        raise HTTPException(status_code=403, detail="Sadece sanatçılar profilini güncelleyebilir")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated


@api.put("/users/me")
async def update_user_profile(body: ArtistUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    # All authenticated users can update these profile fields
    allowed = {"name", "username", "picture", "bio", "location", "phone", "birthday"}
    if user["role"] == "artist":
        allowed |= {"instagram", "contact", "studio_name"}
    updates = {k: v for k, v in updates.items() if k in allowed}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated


@api.put("/users/me/password")
async def change_password(body: PasswordChangeIn, user=Depends(get_current_user)):
    full = await db.users.find_one({"user_id": user["user_id"]})
    if not full or not full.get("password_hash"):
        raise HTTPException(status_code=400, detail="Bu hesap için şifre değiştirilemez")
    if not verify_password(body.current_password, full["password_hash"]):
        raise HTTPException(status_code=401, detail="Mevcut şifre yanlış")
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )
    return {"ok": True}


# ---------- Tattoo Endpoints ----------
@api.get("/feed")
async def feed(
    limit: int = 30,
    exclude_following: bool = False,
    q: Optional[str] = None,
    viewer=Depends(get_optional_user),
):
    """Return artists with their tattoos. Optional location filter (q) and exclude_following.

    'q' supports special value 'nearby' which falls back to viewer.location when set.
    """
    query = {"role": "artist"}
    if q == "nearby" and viewer and viewer.get("location"):
        # Match first word of viewer's location (e.g. 'İstanbul' from 'Beyoğlu, İstanbul')
        token = viewer["location"].split(",")[-1].strip()
        query["location"] = {"$regex": token, "$options": "i"}
    elif q and q not in ("nearby", "all", ""):
        query["location"] = {"$regex": q, "$options": "i"}

    artists = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(500)

    following_ids = set()
    if viewer:
        follows = await db.follows.find({"follower_id": viewer["user_id"]}, {"_id": 0}).to_list(1000)
        following_ids = {f["artist_id"] for f in follows}

    items = []
    liked_ids = set()
    saved_ids = set()
    if viewer:
        likes = await db.likes.find({"user_id": viewer["user_id"]}, {"_id": 0, "tattoo_id": 1}).to_list(2000)
        saves = await db.saves.find({"user_id": viewer["user_id"]}, {"_id": 0, "tattoo_id": 1}).to_list(2000)
        liked_ids = {x["tattoo_id"] for x in likes}
        saved_ids = {x["tattoo_id"] for x in saves}

    for a in artists:
        if exclude_following and a["user_id"] in following_ids:
            continue
        tattoos = await db.tattoos.find({"artist_id": a["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
        if not tattoos:
            continue
        follower_count = await db.follows.count_documents({"artist_id": a["user_id"]})
        for t in tattoos:
            t["like_count"] = await db.likes.count_documents({"tattoo_id": t["tattoo_id"]})
            t["liked"] = t["tattoo_id"] in liked_ids
            t["saved"] = t["tattoo_id"] in saved_ids
        items.append({
            "artist": a,
            "tattoos": tattoos,
            "follower_count": follower_count,
            "is_following": a["user_id"] in following_ids,
        })
    items.sort(key=lambda x: x["tattoos"][0]["created_at"] if x["tattoos"] else "", reverse=True)
    return items[:limit]


@api.get("/feed/following")
async def following_feed(limit: int = 60, user=Depends(get_current_user)):
    """Return individual tattoos from artists the user follows, newest first."""
    follows = await db.follows.find({"follower_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    artist_ids = [f["artist_id"] for f in follows]
    if not artist_ids:
        return []
    tattoos = await db.tattoos.find({"artist_id": {"$in": artist_ids}}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    liked = await db.likes.find({"user_id": user["user_id"]}, {"_id": 0, "tattoo_id": 1}).to_list(2000)
    saved = await db.saves.find({"user_id": user["user_id"]}, {"_id": 0, "tattoo_id": 1}).to_list(2000)
    liked_ids = {x["tattoo_id"] for x in liked}
    saved_ids = {x["tattoo_id"] for x in saved}
    artist_cache = {}
    items = []
    for t in tattoos:
        t["like_count"] = await db.likes.count_documents({"tattoo_id": t["tattoo_id"]})
        t["liked"] = t["tattoo_id"] in liked_ids
        t["saved"] = t["tattoo_id"] in saved_ids
        aid = t["artist_id"]
        if aid not in artist_cache:
            artist_cache[aid] = await db.users.find_one({"user_id": aid}, {"_id": 0, "password_hash": 0})
        items.append({"tattoo": t, "artist": artist_cache[aid]})
    return items


@api.post("/tattoos")
async def upload_tattoo(body: TattooIn, user=Depends(get_current_user)):
    if user["role"] != "artist":
        raise HTTPException(status_code=403, detail="Sadece sanatçılar dövme yükleyebilir")
    if not body.image or len(body.image) < 100:
        raise HTTPException(status_code=400, detail="Geçersiz görsel")
    doc = {
        "tattoo_id": f"t_{uuid.uuid4().hex[:14]}",
        "artist_id": user["user_id"],
        "image": body.image,
        "description": body.description,
        "tags": [t.lower().strip() for t in body.tags if t.strip()],
        "style": body.style,
        "color": body.color,
        "size": body.size,
        "created_at": now_utc().isoformat(),
    }
    await db.tattoos.insert_one(doc)
    doc.pop("_id", None)
    doc["like_count"] = 0
    doc["liked"] = False
    doc["saved"] = False
    return doc


@api.delete("/tattoos/{tattoo_id}")
async def delete_tattoo(tattoo_id: str, user=Depends(get_current_user)):
    t = await db.tattoos.find_one({"tattoo_id": tattoo_id})
    if not t:
        raise HTTPException(status_code=404, detail="Bulunamadı")
    if t["artist_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Yetkisiz")
    await db.tattoos.delete_one({"tattoo_id": tattoo_id})
    await db.likes.delete_many({"tattoo_id": tattoo_id})
    await db.saves.delete_many({"tattoo_id": tattoo_id})
    return {"ok": True}


@api.post("/tattoos/{tattoo_id}/like")
async def toggle_like(tattoo_id: str, user=Depends(get_current_user)):
    t = await db.tattoos.find_one({"tattoo_id": tattoo_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Bulunamadı")
    existing = await db.likes.find_one({"user_id": user["user_id"], "tattoo_id": tattoo_id})
    if existing:
        await db.likes.delete_one({"_id": existing["_id"]})
        liked = False
    else:
        await db.likes.insert_one({
            "user_id": user["user_id"],
            "tattoo_id": tattoo_id,
            "artist_id": t["artist_id"],
            "created_at": now_utc().isoformat(),
        })
        liked = True
    count = await db.likes.count_documents({"tattoo_id": tattoo_id})
    return {"liked": liked, "like_count": count}


@api.post("/tattoos/{tattoo_id}/save")
async def toggle_save(tattoo_id: str, user=Depends(get_current_user)):
    t = await db.tattoos.find_one({"tattoo_id": tattoo_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Bulunamadı")
    existing = await db.saves.find_one({"user_id": user["user_id"], "tattoo_id": tattoo_id})
    if existing:
        await db.saves.delete_one({"_id": existing["_id"]})
        saved = False
    else:
        await db.saves.insert_one({
            "user_id": user["user_id"],
            "tattoo_id": tattoo_id,
            "artist_id": t["artist_id"],
            "created_at": now_utc().isoformat(),
        })
        saved = True
    return {"saved": saved}


@api.get("/moodboard")
async def moodboard(user=Depends(get_current_user)):
    saves = await db.saves.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    items = []
    for s in saves:
        t = await db.tattoos.find_one({"tattoo_id": s["tattoo_id"]}, {"_id": 0})
        if not t:
            continue
        a = await db.users.find_one({"user_id": t["artist_id"]}, {"_id": 0, "password_hash": 0})
        items.append({"tattoo": t, "artist": a})
    return items


# ---------- Follow Endpoints ----------
@api.post("/artists/{artist_id}/follow")
async def toggle_follow(artist_id: str, user=Depends(get_current_user)):
    if artist_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Kendinizi takip edemezsiniz")
    a = await db.users.find_one({"user_id": artist_id, "role": "artist"})
    if not a:
        raise HTTPException(status_code=404, detail="Sanatçı bulunamadı")
    existing = await db.follows.find_one({"follower_id": user["user_id"], "artist_id": artist_id})
    if existing:
        await db.follows.delete_one({"_id": existing["_id"]})
        following = False
    else:
        await db.follows.insert_one({
            "follower_id": user["user_id"],
            "artist_id": artist_id,
            "created_at": now_utc().isoformat(),
        })
        following = True
    count = await db.follows.count_documents({"artist_id": artist_id})
    return {"following": following, "follower_count": count}


@api.get("/follows/me")
async def my_follows(user=Depends(get_current_user)):
    follows = await db.follows.find({"follower_id": user["user_id"]}, {"_id": 0}).to_list(500)
    artist_ids = [f["artist_id"] for f in follows]
    artists = await db.users.find({"user_id": {"$in": artist_ids}}, {"_id": 0, "password_hash": 0}).to_list(500)
    return artists


# ---------- Comments + Ratings ----------
@api.get("/artists/{artist_id}/comments")
async def list_comments(artist_id: str):
    comments = await db.comments.find({"artist_id": artist_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for c in comments:
        u = await db.users.find_one({"user_id": c["user_id"]}, {"_id": 0, "name": 1, "picture": 1})
        c["user_name"] = (u or {}).get("name", "Bilinmeyen")
        c["user_picture"] = (u or {}).get("picture")
    return comments


@api.post("/artists/{artist_id}/comments")
async def add_comment(artist_id: str, body: CommentIn, user=Depends(get_current_user)):
    a = await db.users.find_one({"user_id": artist_id, "role": "artist"})
    if not a:
        raise HTTPException(status_code=404, detail="Sanatçı bulunamadı")
    doc = {
        "comment_id": f"c_{uuid.uuid4().hex[:12]}",
        "artist_id": artist_id,
        "user_id": user["user_id"],
        "text": body.text,
        "created_at": now_utc().isoformat(),
    }
    await db.comments.insert_one(doc)
    doc.pop("_id", None)
    doc["user_name"] = user["name"]
    doc["user_picture"] = user.get("picture")
    return doc


@api.post("/artists/{artist_id}/rating")
async def set_rating(artist_id: str, body: RatingIn, user=Depends(get_current_user)):
    a = await db.users.find_one({"user_id": artist_id, "role": "artist"})
    if not a:
        raise HTTPException(status_code=404, detail="Sanatçı bulunamadı")
    await db.ratings.update_one(
        {"artist_id": artist_id, "user_id": user["user_id"]},
        {"$set": {"stars": body.stars, "created_at": now_utc().isoformat()}},
        upsert=True,
    )
    ratings = await db.ratings.find({"artist_id": artist_id}, {"_id": 0}).to_list(1000)
    avg = round(sum(r["stars"] for r in ratings) / len(ratings), 1) if ratings else 0.0
    return {"rating_avg": avg, "rating_count": len(ratings), "my_rating": body.stars}


# ---------- Tattoo DNA ----------
@api.get("/dna")
async def tattoo_dna(user=Depends(get_current_user)):
    """Compute the user's Tattoo DNA based on their likes + saves + follows."""
    likes = await db.likes.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(2000)
    saves = await db.saves.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(2000)
    follows = await db.follows.find({"follower_id": user["user_id"]}, {"_id": 0}).to_list(2000)

    interaction_tattoo_ids = list({x["tattoo_id"] for x in likes} | {x["tattoo_id"] for x in saves})
    tattoos = await db.tattoos.find({"tattoo_id": {"$in": interaction_tattoo_ids}}, {"_id": 0}).to_list(5000)

    style_counter = Counter()
    color_counter = Counter()
    size_counter = Counter()
    tag_counter = Counter()
    for t in tattoos:
        style_counter[t.get("style", "minimal")] += 1
        color_counter[t.get("color", "black")] += 1
        size_counter[t.get("size", "medium")] += 1
        for tag in t.get("tags", []):
            tag_counter[tag] += 1

    total_style = sum(style_counter.values()) or 1
    total_color = sum(color_counter.values()) or 1
    total_size = sum(size_counter.values()) or 1

    styles = [
        {"name": name, "percent": round(c * 100 / total_style)}
        for name, c in style_counter.most_common()
    ]
    colors = {k: round(v * 100 / total_color) for k, v in color_counter.items()}
    sizes = {k: round(v * 100 / total_size) for k, v in size_counter.items()}
    top_tags = [{"tag": t, "count": c} for t, c in tag_counter.most_common(10)]

    # Best matches: score each artist by tattoo style+tag overlap with user preferences
    preferred_styles = {s["name"] for s in styles[:3]}
    preferred_tags = {t["tag"] for t in top_tags[:8]}

    artists = await db.users.find({"role": "artist"}, {"_id": 0, "password_hash": 0}).to_list(500)
    matches = []
    for a in artists:
        a_tattoos = await db.tattoos.find({"artist_id": a["user_id"]}, {"_id": 0}).to_list(200)
        if not a_tattoos:
            continue
        score = 0
        for t in a_tattoos:
            if t.get("style") in preferred_styles:
                score += 3
            overlap = preferred_tags.intersection(set(t.get("tags") or []))
            score += len(overlap) * 2
            if colors and t.get("color") == max(colors, key=colors.get):
                score += 1
        if score > 0 or not interaction_tattoo_ids:
            matches.append({
                "artist": a,
                "match_score": min(100, round(score * 100 / max(len(a_tattoos) * 4, 1))),
                "preview_image": a_tattoos[0]["image"] if a_tattoos else None,
            })
    # If user has zero interactions, show all artists with score 50 (neutral)
    if not interaction_tattoo_ids:
        for m in matches:
            m["match_score"] = 50
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "styles": styles,
        "colors": colors,
        "sizes": sizes,
        "top_tags": top_tags,
        "totals": {
            "likes": len(likes),
            "saves": len(saves),
            "follows": len(follows),
        },
        "matches": matches[:10],
    }


# ---------- Reviews (verified-client-only rich comments) ----------
@api.get("/artists/{artist_id}/reviews")
async def list_reviews(artist_id: str):
    reviews = await db.reviews.find({"artist_id": artist_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for r in reviews:
        u = await db.users.find_one({"user_id": r["user_id"]}, {"_id": 0, "name": 1, "picture": 1})
        r["user_name"] = (u or {}).get("name", "Bilinmeyen")
        r["user_picture"] = (u or {}).get("picture")
    return reviews


@api.post("/artists/{artist_id}/reviews")
async def add_review(artist_id: str, body: ReviewIn, user=Depends(get_current_user)):
    a = await db.users.find_one({"user_id": artist_id, "role": "artist"})
    if not a:
        raise HTTPException(status_code=404, detail="Sanatçı bulunamadı")
    # Must be a verified client
    verified = await db.verified_clients.find_one({"artist_id": artist_id, "user_id": user["user_id"]})
    if not verified:
        raise HTTPException(
            status_code=403,
            detail="Yorum yapabilmek için bu sanatçıdan dövme yaptırmış ve doğrulanmış olmalısın",
        )
    if not body.text and body.stars is None and not body.photo:
        raise HTTPException(status_code=400, detail="En az bir alan doldurulmalı (puan, yorum veya görsel)")
    doc = {
        "review_id": f"r_{uuid.uuid4().hex[:12]}",
        "artist_id": artist_id,
        "user_id": user["user_id"],
        "text": body.text,
        "stars": body.stars,
        "photo": body.photo,
        "created_at": now_utc().isoformat(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    doc["user_name"] = user["name"]
    doc["user_picture"] = user.get("picture")
    return doc


@api.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user=Depends(get_current_user)):
    r = await db.reviews.find_one({"review_id": review_id})
    if not r:
        raise HTTPException(status_code=404, detail="Bulunamadı")
    if r["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Yetkisiz")
    await db.reviews.delete_one({"review_id": review_id})
    return {"ok": True}


@api.get("/users/me/reviews")
async def my_reviews(user=Depends(get_current_user)):
    """List reviews the current user has authored, with artist info."""
    reviews = await db.reviews.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for r in reviews:
        a = await db.users.find_one({"user_id": r["artist_id"]}, {"_id": 0, "name": 1, "picture": 1, "studio_name": 1})
        r["artist"] = a
    return reviews


# ---------- Verified clients (artist marks a user as confirmed client) ----------
@api.post("/artists/me/verify-client")
async def verify_client(body: VerifyClientIn, user=Depends(get_current_user)):
    if user["role"] != "artist":
        raise HTTPException(status_code=403, detail="Sadece sanatçılar müşteri doğrulayabilir")
    target = await db.users.find_one({"email": body.email.lower().strip()}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Bu email ile kayıtlı kullanıcı yok")
    if target["user_id"] == user["user_id"]:
        raise HTTPException(status_code=400, detail="Kendinizi doğrulayamazsınız")
    if target.get("role") != "user":
        raise HTTPException(status_code=400, detail="Sadece normal kullanıcılar müşteri olarak doğrulanabilir")
    existing = await db.verified_clients.find_one(
        {"artist_id": user["user_id"], "user_id": target["user_id"]}
    )
    if existing:
        return {"already": True, "client": {"user_id": target["user_id"], "name": target["name"], "email": target["email"]}}
    await db.verified_clients.insert_one({
        "artist_id": user["user_id"],
        "user_id": target["user_id"],
        "verified_at": now_utc().isoformat(),
    })
    return {"already": False, "client": {"user_id": target["user_id"], "name": target["name"], "email": target["email"]}}


@api.get("/artists/me/verified-clients")
async def my_verified_clients(user=Depends(get_current_user)):
    if user["role"] != "artist":
        raise HTTPException(status_code=403, detail="Sadece sanatçılar görebilir")
    rows = await db.verified_clients.find({"artist_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    out = []
    for r in rows:
        u = await db.users.find_one({"user_id": r["user_id"]}, {"_id": 0, "name": 1, "email": 1, "picture": 1})
        if u:
            out.append({**u, "verified_at": r["verified_at"]})
    return out


# ---------- Messages (1-1 DMs) ----------
def _conv_id(a: str, b: str) -> str:
    return "::".join(sorted([a, b]))


@api.get("/messages/conversations")
async def list_conversations(user=Depends(get_current_user)):
    """Return distinct conversations for current user with latest message + other participant."""
    cursor = db.messages.find(
        {"$or": [{"sender_id": user["user_id"]}, {"receiver_id": user["user_id"]}]},
        {"_id": 0},
    ).sort("created_at", -1)
    msgs = await cursor.to_list(2000)
    convs = {}
    for m in msgs:
        other = m["receiver_id"] if m["sender_id"] == user["user_id"] else m["sender_id"]
        if other not in convs:
            convs[other] = m
    out = []
    for other_id, last in convs.items():
        u = await db.users.find_one({"user_id": other_id}, {"_id": 0, "password_hash": 0})
        if not u:
            continue
        out.append({"other_user": u, "last_message": last})
    out.sort(key=lambda x: x["last_message"]["created_at"], reverse=True)
    return out


@api.get("/messages/{other_user_id}")
async def conversation(other_user_id: str, user=Depends(get_current_user)):
    cid = _conv_id(user["user_id"], other_user_id)
    msgs = await db.messages.find({"conversation_id": cid}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    other = await db.users.find_one({"user_id": other_user_id}, {"_id": 0, "password_hash": 0})
    if not other:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return {"other_user": other, "messages": msgs}


@api.post("/messages/{other_user_id}")
async def send_message(other_user_id: str, body: MessageIn, user=Depends(get_current_user)):
    if other_user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Kendinize mesaj gönderemezsiniz")
    other = await db.users.find_one({"user_id": other_user_id})
    if not other:
        raise HTTPException(status_code=404, detail="Alıcı bulunamadı")
    doc = {
        "message_id": f"m_{uuid.uuid4().hex[:12]}",
        "conversation_id": _conv_id(user["user_id"], other_user_id),
        "sender_id": user["user_id"],
        "receiver_id": other_user_id,
        "content": body.content,
        "created_at": now_utc().isoformat(),
    }
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ---------- Location helpers (Türkiye il listesi) ----------
TR_PROVINCES = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep",
    "Mersin", "Diyarbakır", "Kayseri", "Eskişehir", "Samsun", "Denizli", "Trabzon",
    "Erzurum", "Sakarya", "Malatya", "Kahramanmaraş", "Van", "Şanlıurfa", "Hatay",
    "Manisa", "Balıkesir", "Aydın", "Tekirdağ", "Muğla", "Kocaeli",
]


@api.get("/locations")
async def locations():
    """List Turkish provinces that currently have artists, plus full list as suggestions."""
    artists = await db.users.find({"role": "artist"}, {"_id": 0, "location": 1}).to_list(2000)
    counts = Counter()
    for a in artists:
        loc = (a.get("location") or "").split(",")[-1].strip()
        if loc:
            counts[loc] += 1
    return {
        "with_artists": [{"name": n, "count": c} for n, c in counts.most_common()],
        "all_provinces": TR_PROVINCES,
    }


# ---------- Health ----------
@api.get("/")
async def root():
    return {"name": "TatScope", "status": "ok"}


# Mount router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.tattoos.create_index("artist_id")
    await db.tattoos.create_index("tattoo_id", unique=True)
    await db.likes.create_index([("user_id", 1), ("tattoo_id", 1)], unique=True)
    await db.saves.create_index([("user_id", 1), ("tattoo_id", 1)], unique=True)
    await db.follows.create_index([("follower_id", 1), ("artist_id", 1)], unique=True)
    await db.ratings.create_index([("artist_id", 1), ("user_id", 1)], unique=True)
    await db.sessions.create_index("session_token", unique=True)
    await db.comments.create_index("artist_id")
    await db.reviews.create_index("artist_id")
    await db.reviews.create_index("user_id")
    await db.verified_clients.create_index([("artist_id", 1), ("user_id", 1)], unique=True)
    await db.messages.create_index("conversation_id")
    await db.messages.create_index("created_at")
    logger.info("Indexes created. TattooMatch API ready.")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@tattoomatch.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin1234!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "user_id": f"u_admin_{uuid.uuid4().hex[:8]}",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "user",
            "picture": None, "bio": None, "location": None,
            "instagram": None, "contact": None, "studio_name": None,
            "auth_provider": "password",
            "created_at": now_utc().isoformat(),
        })


@app.on_event("shutdown")
async def shutdown():
    client.close()
