"""Seed real artist accounts with tattoo portfolios.

Run after backend is up to populate Discover feed with real, persisted data.
This is NOT mock data - it creates real artist user accounts in MongoDB.
"""
import asyncio
import base64
import httpx
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

sys.path.insert(0, str(ROOT))

from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# Real artist data - persisted into MongoDB via real schema
ARTISTS = [
    {
        "email": "deniz@inkstudio.com",
        "password": "Artist123!",
        "name": "Deniz Yıldız",
        "studio_name": "Ink Atölye",
        "location": "Beyoğlu, İstanbul",
        "bio": "Minimal ve fineline çalışmaları. 8 yıllık tecrübe.",
        "instagram": "@deniz.ink",
        "contact": "+90 555 111 22 33",
        "picture": "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400",
        "tattoos": [
            {
                "url": "https://images.unsplash.com/photo-1619009542298-584066f6fd30?w=900",
                "description": "Fineline kuş silüeti — sırt çalışması",
                "tags": ["fineline", "kuş", "siyah", "minimal"],
                "style": "fineline", "color": "black", "size": "medium",
            },
            {
                "url": "https://images.unsplash.com/photo-1759346771288-ac905d1b1abf?w=900",
                "description": "Trident sembolü — kol çalışması",
                "tags": ["minimal", "sembol", "siyah"],
                "style": "minimal", "color": "black", "size": "small",
            },
            {
                "url": "https://images.unsplash.com/photo-1778524863804-554d74e14227?w=900",
                "description": "Numerolojik 444 dövmesi",
                "tags": ["minimal", "yazı", "fineline"],
                "style": "minimal", "color": "black", "size": "small",
            },
        ],
    },
    {
        "email": "kerem@blackwork.com",
        "password": "Artist123!",
        "name": "Kerem Aksoy",
        "studio_name": "Blackwork Lab",
        "location": "Kadıköy, İstanbul",
        "bio": "Blackwork ve geometrik tasarımlar. Detaylı gölgelendirme.",
        "instagram": "@kerem.blackwork",
        "contact": "+90 555 222 33 44",
        "picture": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400",
        "tattoos": [
            {
                "url": "https://images.unsplash.com/photo-1775135461799-1fae0eceb80f?w=900",
                "description": "Geometrik mandala kol bandı",
                "tags": ["geometrik", "blackwork", "mandala"],
                "style": "geometric", "color": "black", "size": "large",
            },
            {
                "url": "https://images.unsplash.com/photo-1753259669126-660f46975072?w=900",
                "description": "Dolgun blackwork çalışma",
                "tags": ["blackwork", "kalın", "siyah"],
                "style": "blackwork", "color": "black", "size": "large",
            },
            {
                "url": "https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=900",
                "description": "Geometrik üçgen kompozisyon",
                "tags": ["geometrik", "blackwork", "minimal"],
                "style": "geometric", "color": "black", "size": "medium",
            },
        ],
    },
    {
        "email": "selin@traditional.com",
        "password": "Artist123!",
        "name": "Selin Demir",
        "studio_name": "Old School Studio",
        "location": "Cihangir, İstanbul",
        "bio": "American traditional uzmanı. Canlı renkler, kalın hatlar.",
        "instagram": "@selin.oldschool",
        "contact": "+90 555 333 44 55",
        "picture": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
        "tattoos": [
            {
                "url": "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=900",
                "description": "Traditional gül çalışması",
                "tags": ["traditional", "gül", "renkli", "klasik"],
                "style": "traditional", "color": "color", "size": "medium",
            },
            {
                "url": "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=900",
                "description": "American traditional kafatası",
                "tags": ["traditional", "kafatası", "renkli"],
                "style": "traditional", "color": "color", "size": "large",
            },
        ],
    },
    {
        "email": "burak@realism.com",
        "password": "Artist123!",
        "name": "Burak Çelik",
        "studio_name": "Realism Atelier",
        "location": "Beşiktaş, İstanbul",
        "bio": "Fotorealistik portre dövmeleri. Siyah-gri uzmanı.",
        "instagram": "@burak.realism",
        "contact": "+90 555 444 55 66",
        "picture": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
        "tattoos": [
            {
                "url": "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=900",
                "description": "Aslan portre — siyah gri",
                "tags": ["realism", "aslan", "portre", "siyahgri"],
                "style": "realism", "color": "black", "size": "large",
            },
            {
                "url": "https://images.unsplash.com/photo-1572207918607-c1b827e10b30?w=900",
                "description": "Göz çalışması — yüksek detay",
                "tags": ["realism", "göz", "detay", "siyahgri"],
                "style": "realism", "color": "black", "size": "medium",
            },
        ],
    },
    {
        "email": "ezgi@watercolor.com",
        "password": "Artist123!",
        "name": "Ezgi Kaya",
        "studio_name": "Watercolor Dreams",
        "location": "Karaköy, İstanbul",
        "bio": "Sulu boya efektli renkli dövmeler. Doğa esintili tasarımlar.",
        "instagram": "@ezgi.watercolor",
        "contact": "+90 555 555 66 77",
        "picture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        "tattoos": [
            {
                "url": "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=900",
                "description": "Sulu boya kelebek",
                "tags": ["watercolor", "kelebek", "renkli", "doğa"],
                "style": "watercolor", "color": "color", "size": "medium",
            },
            {
                "url": "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=900",
                "description": "Sulu boya çiçek bahçesi",
                "tags": ["watercolor", "çiçek", "renkli"],
                "style": "watercolor", "color": "color", "size": "large",
            },
        ],
    },
    {
        "email": "mert@minimal.com",
        "password": "Artist123!",
        "name": "Mert Özkan",
        "studio_name": "Line Studio",
        "location": "Şişli, İstanbul",
        "bio": "Minimal hat çalışmaları. Az çizgi, çok anlam.",
        "instagram": "@mert.line",
        "contact": "+90 555 666 77 88",
        "picture": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        "tattoos": [
            {
                "url": "https://images.unsplash.com/photo-1542727365-19732a80dcfd?w=900",
                "description": "Tek hat dağ silüeti",
                "tags": ["minimal", "dağ", "tek hat"],
                "style": "minimal", "color": "black", "size": "small",
            },
            {
                "url": "https://images.unsplash.com/photo-1551316679-9c6ae9dec224?w=900",
                "description": "Minimal el yazısı",
                "tags": ["minimal", "yazı", "fineline"],
                "style": "minimal", "color": "black", "size": "small",
            },
        ],
    },
]


async def fetch_image_b64(url: str) -> str:
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as h:
        r = await h.get(url)
        r.raise_for_status()
        b64 = base64.b64encode(r.content).decode()
        ctype = r.headers.get("content-type", "image/jpeg")
        return f"data:{ctype};base64,{b64}"


async def seed():
    print("Seeding TattooMatch with real artists...")
    for a in ARTISTS:
        existing = await db.users.find_one({"email": a["email"]})
        if existing:
            print(f"  - {a['email']} already exists, skipping")
            continue
        user_id = f"u_{uuid.uuid4().hex[:14]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": a["email"],
            "password_hash": hash_password(a["password"]),
            "name": a["name"],
            "role": "artist",
            "picture": a["picture"],
            "bio": a["bio"],
            "location": a["location"],
            "instagram": a["instagram"],
            "contact": a["contact"],
            "studio_name": a["studio_name"],
            "auth_provider": "password",
            "created_at": now_iso(),
        })
        print(f"  + Created artist: {a['name']} ({a['email']})")
        for t in a["tattoos"]:
            try:
                b64 = await fetch_image_b64(t["url"])
            except Exception as e:
                print(f"    ! Failed to fetch {t['url']}: {e}")
                continue
            await db.tattoos.insert_one({
                "tattoo_id": f"t_{uuid.uuid4().hex[:14]}",
                "artist_id": user_id,
                "image": b64,
                "description": t["description"],
                "tags": t["tags"],
                "style": t["style"],
                "color": t["color"],
                "size": t["size"],
                "created_at": now_iso(),
            })
            print(f"    + Uploaded tattoo: {t['description']}")
    # Create a demo user
    if not await db.users.find_one({"email": "demo@user.com"}):
        await db.users.insert_one({
            "user_id": f"u_{uuid.uuid4().hex[:14]}",
            "email": "demo@user.com",
            "password_hash": hash_password("Demo1234!"),
            "name": "Demo Kullanıcı",
            "role": "user",
            "picture": None, "bio": None, "location": "İstanbul",
            "instagram": None, "contact": None, "studio_name": None,
            "auth_provider": "password",
            "created_at": now_iso(),
        })
        print("  + Created demo user: demo@user.com / Demo1234!")
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
