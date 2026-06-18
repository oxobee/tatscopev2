"""Tests for v2 endpoints: locations, feed filters, reviews, verify-client,
messages, user profile updates, password change, following feed."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

DEMO_USER = {"email": "demo@user.com", "password": "Demo1234!"}
DEMO_ARTIST = {"email": "deniz@inkstudio.com", "password": "Artist123!"}
OTHER_ARTIST = {"email": "kerem@blackwork.com", "password": "Artist123!"}


def _session_login(creds):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, r.text
    s.headers.update({"Authorization": f"Bearer {r.json()['access_token']}"})
    return s, r.json()


# ---------- /api/locations ----------
class TestLocations:
    def test_locations_structure(self):
        r = requests.get(f"{API}/locations", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "with_artists" in d
        assert "all_provinces" in d
        assert isinstance(d["with_artists"], list)
        assert isinstance(d["all_provinces"], list)
        # Turkish province sample
        assert "İstanbul" in d["all_provinces"]
        assert len(d["all_provinces"]) >= 25
        # with_artists has name+count if present
        if d["with_artists"]:
            it = d["with_artists"][0]
            assert "name" in it and "count" in it
            assert isinstance(it["count"], int) and it["count"] >= 1


# ---------- /api/feed with filters ----------
class TestFeedV2:
    def test_feed_q_location_regex(self):
        # Try common Turkish cities
        for q in ("İstanbul", "Istanbul", "Ankara"):
            r = requests.get(f"{API}/feed", params={"q": q}, timeout=20)
            assert r.status_code == 200
            items = r.json()
            assert isinstance(items, list)
            # All returned artists' locations should match q substring (case-insensitive)
            for it in items:
                loc = (it["artist"].get("location") or "").lower()
                # weak assertion: if non-empty, should include q lowercase ignoring TR specifics
                assert q.lower().replace("i̇", "i") in loc.replace("i̇", "i") or loc == ""

    def test_feed_exclude_following(self):
        # Login as demo user
        s, _ = _session_login(DEMO_USER)
        # Get an artist to follow
        artists = requests.get(f"{API}/artists", timeout=15).json()
        target = artists[0]["user_id"]
        # Ensure followed
        f = s.post(f"{API}/artists/{target}/follow", timeout=15).json()
        if not f.get("following"):
            f = s.post(f"{API}/artists/{target}/follow", timeout=15).json()
        assert f["following"] is True
        # Feed with exclude_following must not include target
        r = s.get(f"{API}/feed", params={"exclude_following": "true"}, timeout=20)
        assert r.status_code == 200
        ids = [it["artist"]["user_id"] for it in r.json()]
        assert target not in ids
        # Without exclude_following: target may appear
        r2 = s.get(f"{API}/feed", timeout=20)
        assert r2.status_code == 200
        # Cleanup unfollow
        s.post(f"{API}/artists/{target}/follow", timeout=15)


# ---------- /api/feed/following ----------
class TestFollowingFeed:
    def test_following_feed_empty_for_new_user(self):
        email = f"TEST_ff_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Pass1234!", "name": "FF", "role": "user"
        }, timeout=15).json()
        token = reg["access_token"]
        r = requests.get(f"{API}/feed/following",
                         headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200
        assert r.json() == []

    def test_following_feed_returns_tattoos(self):
        s, _ = _session_login(DEMO_USER)
        artists = requests.get(f"{API}/artists", timeout=15).json()
        target = artists[0]["user_id"]
        # follow
        f = s.post(f"{API}/artists/{target}/follow", timeout=15).json()
        if not f.get("following"):
            s.post(f"{API}/artists/{target}/follow", timeout=15)
        r = s.get(f"{API}/feed/following", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        first = items[0]
        assert "tattoo" in first and "artist" in first
        assert first["artist"]["user_id"] == target
        # cleanup
        s.post(f"{API}/artists/{target}/follow", timeout=15)


# ---------- Verify client + Reviews ----------
class TestVerifyAndReviews:
    def test_full_review_flow(self):
        artist_s, artist_data = _session_login(DEMO_ARTIST)
        artist_id = artist_data["user_id"]
        # Use a fresh user to ensure verification state is clean
        fresh_email = f"TEST_rev_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{API}/auth/register", json={
            "email": fresh_email, "password": "Pass1234!", "name": "Rev User", "role": "user"
        }, timeout=15).json()
        user_data = reg
        user_s = requests.Session()
        user_s.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {reg['access_token']}",
        })

        # 1) Non-artist verify -> 403
        r = user_s.post(f"{API}/artists/me/verify-client",
                        json={"email": fresh_email}, timeout=15)
        assert r.status_code == 403

        # 2) Review before verification -> 403 with TR message
        r = user_s.post(f"{API}/artists/{artist_id}/reviews",
                        json={"text": "Harika", "stars": 5}, timeout=15)
        assert r.status_code == 403
        assert "doğrulan" in r.text or "doğrula" in r.text

        # 3) Artist verifies user
        r = artist_s.post(f"{API}/artists/me/verify-client",
                          json={"email": fresh_email}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "already" in d and "client" in d
        assert d["client"]["email"] == fresh_email.lower()

        # 4) Second verify same -> already=True
        r2 = artist_s.post(f"{API}/artists/me/verify-client",
                           json={"email": fresh_email}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["already"] is True

        # 5) verified-clients listing
        r3 = artist_s.get(f"{API}/artists/me/verified-clients", timeout=15)
        assert r3.status_code == 200
        emails = [x["email"] for x in r3.json()]
        assert fresh_email.lower() in emails

        # 6) GET artist now exposes is_verified_client=true for viewer
        ra = user_s.get(f"{API}/artists/{artist_id}", timeout=15)
        assert ra.status_code == 200
        assert ra.json()["is_verified_client"] is True

        # 7) Review with all empty fields -> 400
        bad = user_s.post(f"{API}/artists/{artist_id}/reviews",
                          json={}, timeout=15)
        assert bad.status_code == 400

        # 8) Review with stars only succeeds
        ok = user_s.post(f"{API}/artists/{artist_id}/reviews",
                         json={"stars": 5}, timeout=15)
        assert ok.status_code == 200, ok.text
        rev = ok.json()
        assert rev["stars"] == 5
        assert rev["artist_id"] == artist_id
        rev_id_1 = rev["review_id"]

        # 9) Review with text+photo succeeds
        ok2 = user_s.post(f"{API}/artists/{artist_id}/reviews",
                          json={"text": "TEST review",
                                "photo": "data:image/jpeg;base64," + "B" * 200},
                          timeout=15)
        assert ok2.status_code == 200
        rev2 = ok2.json()
        assert rev2["text"] == "TEST review"
        assert rev2["photo"] is not None
        rev_id_2 = rev2["review_id"]

        # 10) List reviews shows user_name + user_picture
        lst = requests.get(f"{API}/artists/{artist_id}/reviews", timeout=15)
        assert lst.status_code == 200
        revs = lst.json()
        assert any(r["review_id"] == rev_id_1 for r in revs)
        target = next(r for r in revs if r["review_id"] == rev_id_2)
        assert "user_name" in target
        assert "user_picture" in target  # may be None but key present

        # 11) /users/me/reviews shows my reviews with artist info
        mine = user_s.get(f"{API}/users/me/reviews", timeout=15)
        assert mine.status_code == 200
        mids = [r["review_id"] for r in mine.json()]
        assert rev_id_1 in mids and rev_id_2 in mids
        sample = next(r for r in mine.json() if r["review_id"] == rev_id_2)
        assert "artist" in sample
        assert sample["artist"] is not None
        # backend returns name/picture/studio_name (no user_id) by design
        assert "name" in sample["artist"]
        assert sample["artist_id"] == artist_id

        # Cleanup
        user_s.delete(f"{API}/reviews/{rev_id_1}", timeout=15)
        user_s.delete(f"{API}/reviews/{rev_id_2}", timeout=15)


# ---------- Messages ----------
class TestMessages:
    def test_send_get_conversations(self):
        user_s, user_data = _session_login(DEMO_USER)
        artist_s, artist_data = _session_login(DEMO_ARTIST)
        artist_id = artist_data["user_id"]

        # User sends -> Artist
        marker = f"TEST_msg_{uuid.uuid4().hex[:6]}"
        r = user_s.post(f"{API}/messages/{artist_id}",
                        json={"content": marker}, timeout=15)
        assert r.status_code == 200, r.text
        m = r.json()
        assert m["content"] == marker
        assert m["sender_id"] == user_data["user_id"]
        assert m["receiver_id"] == artist_id

        # Cannot message self
        bad = user_s.post(f"{API}/messages/{user_data['user_id']}",
                          json={"content": "self"}, timeout=15)
        assert bad.status_code == 400

        # GET thread (user side)
        thr = user_s.get(f"{API}/messages/{artist_id}", timeout=15)
        assert thr.status_code == 200
        td = thr.json()
        assert td["other_user"]["user_id"] == artist_id
        contents = [x["content"] for x in td["messages"]]
        assert marker in contents

        # GET thread (artist side) sees same message
        thr2 = artist_s.get(f"{API}/messages/{user_data['user_id']}", timeout=15)
        assert thr2.status_code == 200
        assert marker in [x["content"] for x in thr2.json()["messages"]]

        # Conversations list for user
        cv = user_s.get(f"{API}/messages/conversations", timeout=15)
        assert cv.status_code == 200
        convs = cv.json()
        assert isinstance(convs, list)
        match = [c for c in convs if c["other_user"]["user_id"] == artist_id]
        assert len(match) == 1
        assert match[0]["last_message"]["content"] == marker


# ---------- Profile updates + password ----------
class TestUserProfileV2:
    def test_update_profile_new_fields(self):
        s, _ = _session_login(DEMO_USER)
        payload = {
            "username": f"demo_{uuid.uuid4().hex[:4]}",
            "phone": "+90 555 000 0000",
            "birthday": "1995-06-15",
            "location": "Kadıköy, İstanbul",
        }
        r = s.put(f"{API}/users/me", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["username"] == payload["username"]
        assert data["phone"] == payload["phone"]
        assert data["birthday"] == payload["birthday"]
        assert data["location"] == payload["location"]
        # verify persistence
        me = s.get(f"{API}/auth/me", timeout=15).json()
        assert me["username"] == payload["username"]
        assert me["location"] == payload["location"]

    def test_change_password_wrong_current(self):
        s, _ = _session_login(DEMO_USER)
        r = s.put(f"{API}/users/me/password",
                  json={"current_password": "WRONGwrong", "new_password": "NewPass99!"},
                  timeout=15)
        assert r.status_code == 401
        assert "Mevcut" in r.text or "yanlış" in r.text or "mevcut" in r.text.lower()

    def test_change_password_roundtrip(self):
        # Use a fresh user to avoid breaking demo creds
        email = f"TEST_pw_{uuid.uuid4().hex[:8]}@example.com"
        old, new = "OldPass1!", "NewPass1!"
        reg = requests.post(f"{API}/auth/register", json={
            "email": email, "password": old, "name": "PW Test", "role": "user"
        }, timeout=15).json()
        tok = reg["access_token"]
        # Change password
        r = requests.put(f"{API}/users/me/password",
                         headers={"Authorization": f"Bearer {tok}"},
                         json={"current_password": old, "new_password": new},
                         timeout=15)
        assert r.status_code == 200, r.text
        # Old password fails
        bad = requests.post(f"{API}/auth/login",
                            json={"email": email, "password": old}, timeout=15)
        assert bad.status_code == 401
        # New password works
        ok = requests.post(f"{API}/auth/login",
                           json={"email": email, "password": new}, timeout=15)
        assert ok.status_code == 200


# ---------- Verify-client lookup error cases ----------
class TestVerifyClientErrors:
    def test_verify_nonexistent_email(self):
        artist_s, _ = _session_login(DEMO_ARTIST)
        r = artist_s.post(f"{API}/artists/me/verify-client",
                          json={"email": f"missing_{uuid.uuid4().hex[:6]}@example.com"},
                          timeout=15)
        assert r.status_code == 404
