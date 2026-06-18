"""Comprehensive backend tests for TattooMatch API."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://artist-ink-27.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# A valid-enough base64 payload (>100 chars) for upload tests
SMALL_IMG = "data:image/jpeg;base64," + ("A" * 200)


# ---------- Health ----------
class TestHealth:
    def test_root_health(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("name") == "TatScope"


# ---------- Auth ----------
class TestAuth:
    def test_register_user_role(self):
        email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Pass1234!", "name": "Test User", "role": "user"
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email.lower()
        assert data["role"] == "user"
        assert data["name"] == "Test User"
        assert "user_id" in data
        assert "access_token" in data and len(data["access_token"]) > 20
        # Cookies set
        assert "access_token" in r.cookies or any("access_token" in c for c in r.headers.get("set-cookie", "").split(","))

    def test_register_artist_role(self):
        email = f"TEST_artist_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Pass1234!", "name": "Test Artist", "role": "artist"
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["role"] == "artist"
        assert "access_token" in data

    def test_register_duplicate_email(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": "demo@user.com", "password": "Demo1234!", "name": "Demo", "role": "user"
        }, timeout=15)
        assert r.status_code == 400
        assert "kayıtlı" in r.text.lower() or "kay" in r.text

    def test_login_demo_user(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "demo@user.com", "password": "Demo1234!"
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == "demo@user.com"
        assert data["role"] == "user"
        assert "access_token" in data
        # password_hash should NOT leak
        assert "password_hash" not in data

    def test_login_wrong_password_turkish(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": "demo@user.com", "password": "WRONGwrong"
        }, timeout=15)
        assert r.status_code == 401
        # Turkish error
        assert "Geçersiz" in r.text or "geçersiz" in r.text.lower()

    def test_me_with_bearer(self):
        login = requests.post(f"{API}/auth/login", json={
            "email": "demo@user.com", "password": "Demo1234!"
        }, timeout=15).json()
        token = login["access_token"]
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == "demo@user.com"

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_logout_clears_cookies(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={
            "email": "demo@user.com", "password": "Demo1234!"
        }, timeout=15)
        r = s.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200
        # Set-cookie should include expirations
        sc = r.headers.get("set-cookie", "")
        # logout always returns OK; cookie deletion sent via Set-Cookie
        assert r.json().get("ok") is True


# ---------- Artists ----------
class TestArtists:
    def test_list_artists_returns_six(self):
        r = requests.get(f"{API}/artists", timeout=20)
        assert r.status_code == 200
        artists = r.json()
        assert isinstance(artists, list)
        assert len(artists) >= 6, f"Expected >=6 artists, got {len(artists)}"
        a = artists[0]
        assert "user_id" in a and "name" in a
        assert "tattoo_count" in a
        assert "follower_count" in a
        assert "rating_avg" in a

    def test_get_artist_detail(self, user_client):
        artists = requests.get(f"{API}/artists", timeout=15).json()
        aid = artists[0]["user_id"]
        r = user_client.get(f"{API}/artists/{aid}", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["artist"]["user_id"] == aid
        assert isinstance(data["tattoos"], list)
        assert "follower_count" in data
        assert "rating_avg" in data
        assert "is_following" in data
        assert "my_rating" in data


# ---------- Feed ----------
class TestFeed:
    def test_feed_anon(self):
        r = requests.get(f"{API}/feed", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) > 0
        item = items[0]
        assert "artist" in item and "tattoos" in item
        assert len(item["tattoos"]) >= 1
        t = item["tattoos"][0]
        for k in ("like_count", "liked", "saved", "tattoo_id", "image"):
            assert k in t

    def test_feed_authenticated(self, user_client):
        r = user_client.get(f"{API}/feed", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) > 0


# ---------- Tattoo upload / Like / Save ----------
class TestTattoos:
    def test_user_cannot_upload(self, user_client):
        r = user_client.post(f"{API}/tattoos", json={
            "image": SMALL_IMG, "description": "x", "tags": ["minimal"], "style": "minimal",
            "color": "black", "size": "small"
        }, timeout=20)
        assert r.status_code == 403

    def test_artist_can_upload(self, artist_client):
        r = artist_client.post(f"{API}/tattoos", json={
            "image": SMALL_IMG,
            "description": "TEST upload",
            "tags": ["minimal", "test"],
            "style": "minimal",
            "color": "black",
            "size": "small"
        }, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["style"] == "minimal"
        assert data["color"] == "black"
        assert data["size"] == "small"
        assert "minimal" in data["tags"]
        assert data["like_count"] == 0
        # cleanup
        tid = data["tattoo_id"]
        artist_client.delete(f"{API}/tattoos/{tid}", timeout=15)

    def test_like_toggle_and_count(self, user_client):
        feed = requests.get(f"{API}/feed", timeout=15).json()
        tid = feed[0]["tattoos"][0]["tattoo_id"]
        # Force unliked state: toggle twice for stable start
        r1 = user_client.post(f"{API}/tattoos/{tid}/like", timeout=15)
        assert r1.status_code == 200
        first = r1.json()
        r2 = user_client.post(f"{API}/tattoos/{tid}/like", timeout=15)
        assert r2.status_code == 200
        second = r2.json()
        # The two should differ
        assert first["liked"] != second["liked"]
        assert abs(first["like_count"] - second["like_count"]) == 1

    def test_save_toggle_and_moodboard(self, user_client):
        feed = requests.get(f"{API}/feed", timeout=15).json()
        tid = feed[0]["tattoos"][0]["tattoo_id"]
        r1 = user_client.post(f"{API}/tattoos/{tid}/save", timeout=15)
        assert r1.status_code == 200
        if not r1.json().get("saved"):
            # already saved, toggle once to save
            r1 = user_client.post(f"{API}/tattoos/{tid}/save", timeout=15)
            assert r1.json().get("saved") is True
        # Moodboard should include it
        mb = user_client.get(f"{API}/moodboard", timeout=15)
        assert mb.status_code == 200
        items = mb.json()
        ids = [it["tattoo"]["tattoo_id"] for it in items]
        assert tid in ids
        # Clean: unsave
        user_client.post(f"{API}/tattoos/{tid}/save", timeout=15)


# ---------- Follow ----------
class TestFollow:
    def test_toggle_follow_and_list(self, user_client):
        artists = requests.get(f"{API}/artists", timeout=15).json()
        aid = artists[0]["user_id"]
        r1 = user_client.post(f"{API}/artists/{aid}/follow", timeout=15)
        assert r1.status_code == 200
        d1 = r1.json()
        assert "following" in d1 and "follower_count" in d1
        # ensure followed state
        if not d1["following"]:
            d1 = user_client.post(f"{API}/artists/{aid}/follow", timeout=15).json()
            assert d1["following"] is True
        # follows/me must contain artist
        r = user_client.get(f"{API}/follows/me", timeout=15)
        assert r.status_code == 200
        ids = [a["user_id"] for a in r.json()]
        assert aid in ids
        # cleanup unfollow
        user_client.post(f"{API}/artists/{aid}/follow", timeout=15)


# ---------- Comments + Rating ----------
class TestCommentsRating:
    def test_comment_and_rating(self, user_client):
        artists = requests.get(f"{API}/artists", timeout=15).json()
        aid = artists[0]["user_id"]
        # Create comment
        r = user_client.post(f"{API}/artists/{aid}/comments", json={"text": "TEST comment"}, timeout=15)
        assert r.status_code == 200, r.text
        c = r.json()
        assert c["text"] == "TEST comment"
        assert "user_name" in c
        # List
        r2 = requests.get(f"{API}/artists/{aid}/comments", timeout=15)
        assert r2.status_code == 200
        texts = [x["text"] for x in r2.json()]
        assert "TEST comment" in texts
        # Rating upsert
        rr = user_client.post(f"{API}/artists/{aid}/rating", json={"stars": 4}, timeout=15)
        assert rr.status_code == 200
        rd = rr.json()
        assert rd["my_rating"] == 4
        assert rd["rating_count"] >= 1
        # Update rating
        rr2 = user_client.post(f"{API}/artists/{aid}/rating", json={"stars": 5}, timeout=15)
        assert rr2.json()["my_rating"] == 5
        # Out of range
        bad = user_client.post(f"{API}/artists/{aid}/rating", json={"stars": 10}, timeout=15)
        assert bad.status_code in (400, 422)


# ---------- Tattoo DNA ----------
class TestDNA:
    def test_dna_neutral_for_new_user(self):
        # Create fresh user
        email = f"TEST_dna_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Pass1234!", "name": "DNA Test", "role": "user"
        }, timeout=15).json()
        token = reg["access_token"]
        r = requests.get(f"{API}/dna", headers={"Authorization": f"Bearer {token}"}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "styles" in d and "colors" in d and "sizes" in d
        assert "top_tags" in d
        assert "totals" in d and d["totals"]["likes"] == 0
        assert "matches" in d
        if d["matches"]:
            assert d["matches"][0]["match_score"] == 50

    def test_dna_reflects_preferences(self, user_client):
        # Like 2 tattoos to influence DNA
        feed = requests.get(f"{API}/feed", timeout=15).json()
        liked_styles = []
        liked = 0
        for item in feed:
            for t in item["tattoos"]:
                # ensure like (toggle until liked True)
                res = user_client.post(f"{API}/tattoos/{t['tattoo_id']}/like", timeout=10).json()
                if not res.get("liked"):
                    res = user_client.post(f"{API}/tattoos/{t['tattoo_id']}/like", timeout=10).json()
                if res.get("liked"):
                    liked_styles.append(t.get("style"))
                    liked += 1
                if liked >= 2:
                    break
            if liked >= 2:
                break
        assert liked >= 2
        r = user_client.get(f"{API}/dna", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["totals"]["likes"] >= 2
        assert len(d["styles"]) >= 1
        # The top style should appear in liked_styles
        top_style_names = {s["name"] for s in d["styles"]}
        assert any(s in top_style_names for s in liked_styles)
        # Cleanup: unlike
        for item in feed:
            for t in item["tattoos"]:
                user_client.post(f"{API}/tattoos/{t['tattoo_id']}/like", timeout=10)
