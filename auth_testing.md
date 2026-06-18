# TattooMatch — Auth Testing Playbook

## Endpoints
- POST `/api/auth/register` — body `{email, password, name, role}`. Returns user + access_token in body; sets `access_token` & `refresh_token` httpOnly cookies.
- POST `/api/auth/login` — body `{email, password}`. Same response shape as register.
- POST `/api/auth/session` — body `{session_id}` (Emergent OAuth callback). Returns user; sets `session_token` httpOnly cookie.
- POST `/api/auth/logout` — clears cookies and deletes server session.
- GET `/api/auth/me` — requires auth (cookie or `Authorization: Bearer <access_token>`). Returns current user.
- POST `/api/auth/refresh` — exchanges refresh_token cookie for new access_token cookie.

## Auth strategies (both supported simultaneously)
1. **JWT email/password**: `access_token` in `Authorization: Bearer` header or httpOnly cookie. 24h validity.
2. **Emergent Google OAuth**: `session_token` cookie. Backend `_resolve_user_from_session` checks `db.sessions`. 7-day validity.

The `get_current_user` dependency tries JWT first (cookie + Bearer), then falls back to Emergent session_token.

## Seeded Credentials (see `test_credentials.md`)
- `admin@tattoomatch.com / Admin1234!`
- `demo@user.com / Demo1234!`
- Artist accounts: `deniz@inkstudio.com / Artist123!` etc.

## Basic curl smoke test
```bash
API="https://artist-ink-27.preview.emergentagent.com"

# Login
TOKEN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"Demo1234!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# Me
curl -s "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Feed
curl -s "$API/api/feed" -H "Authorization: Bearer $TOKEN"
```

## Browser-based test
- Visit `/login`, enter `demo@user.com / Demo1234!`, click "Giriş Yap" (data-testid="login-submit-btn")
- Should redirect to `/app/discover`
- All subsequent calls authenticated via cookie + localStorage `access_token`
