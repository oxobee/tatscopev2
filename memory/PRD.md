# TattooMatch — Product Requirements (Living Document)

## Original Problem
TattooMatch — "Tinder for Tattoo Artists". Production-ready, full-stack matchmaking platform with swipe-based discovery and AI-driven "Tattoo DNA" style matching.

## Tech Stack (selected)
- Frontend: React 19 + Tailwind + Framer Motion + shadcn/ui + lucide-react
- Backend: FastAPI + MongoDB (motor)
- Auth: JWT (email/password) + Emergent Google OAuth (both share users collection)
- Language: Turkish UI

## User Personas
- **Kullanıcı (User)**: browses artists, swipes, likes, saves to Panom (moodboard), follows, comments, rates.
- **Sanatçı (Artist)**: creates profile, uploads portfolio (image+tags+style+color+size), edits studio info, receives likes/follows/ratings/comments.

## Implemented (v1.0 — date: 2026-02-17)
- Auth: JWT email/password + Emergent Google OAuth, role selection at signup
- Splash + Onboarding (Turkish)
- Discover feed: TikTok-style vertical scroll snap, horizontal gallery per artist, double-tap save, like button, follow button, fullscreen viewer
- Moodboard (Panom): masonry grid of saved tattoos
- Tattoo DNA: heuristic style/color/size aggregation from user's likes/saves + match scoring against artists
- Artist Profile: hero header, portfolio grid, ratings (1-5), comments, follow toggle
- Artist Dashboard (Stüdyo): upload tattoo (image base64 + tags + style + color + size), edit studio info, portfolio CRUD
- Right panel (desktop): stats, DNA mini-preview, best matches
- Bottom nav (mobile)
- Seeded 6 real artists with portfolio + demo user
- Real-time-ish via react state mutation on each action (no websockets — relies on instant cache update)

## Core Schemas (MongoDB)
- `users`: user_id, email, password_hash, name, role, picture, bio, location, instagram, contact, studio_name, auth_provider, created_at
- `tattoos`: tattoo_id, artist_id, image (base64), description, tags[], style, color, size, created_at
- `likes` / `saves`: user_id, tattoo_id, artist_id, created_at
- `follows`: follower_id, artist_id, created_at
- `comments`: comment_id, artist_id, user_id, text, created_at
- `ratings`: artist_id, user_id, stars, created_at
- `sessions`: user_id, session_token, expires_at (for Emergent OAuth)

## Backlog (P1)
- Real-time push (WebSockets) for new tattoos/likes
- Message/chat between user and artist
- Search filter by style/location
- Artist availability calendar
- Onboarding personalization quiz (boost DNA cold-start)

## Backlog (P2)
- Image compression before base64 upload
- Push notifications (PWA)
- Multi-image carousel per tattoo
- Artist verification badge + tiers
