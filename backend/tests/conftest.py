import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://artist-ink-27.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

DEMO_USER = {"email": "demo@user.com", "password": "Demo1234!"}
DEMO_ARTIST = {"email": "deniz@inkstudio.com", "password": "Artist123!"}


@pytest.fixture(scope="session")
def api_url():
    return API


@pytest.fixture
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(client, creds):
    r = client.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token")
    assert token, "No access_token in login response"
    client.headers.update({"Authorization": f"Bearer {token}"})
    return data


@pytest.fixture
def user_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, DEMO_USER)
    return s


@pytest.fixture
def artist_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, DEMO_ARTIST)
    return s
