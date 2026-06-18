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

## Implemented (v2.0 — date: 2026-02-18)
- **Bottom nav**: Floating pill popup-style (glass, rounded-full, fixed bottom-4) with sliding active background animation
- **Reviews system**: Only verified clients can review (text/stars/photo any subset). Artists verify users by email via "Müşteri Doğrula" dialog. Review cards show photo + stars + BadgeCheck.
- **Messaging**: 1-1 DM with conversation list + chat thread (Messages page, polled every 5s)
- **Following feed**: Separate route `/app/following-feed` with cards from followed artists; Discover now excludes followed artists by default
- **DNA hub**: Profile tab replaced; hero with avatar+name+visits count+reviews count+settings; SettingsDialog with Profil/Hesap/Şifre tabs (phone, birthday, location, password change)
- **Horizontal swipe gallery** in Discover feed cards (Framer Motion drag)
- **Filter popup**: Single floating button → animated popup (Tümünü Göster, Yakınımdakiler, sanatçısı olan iller, full TR provinces search)
- **Fullscreen tattoo viewer**: Rounded-corner popup for tattoos and review photos in Artist Profile
- **Discover icons**: like + save + dislike (hides artist) + message — all with whileTap/whileHover micro-animations
- **User fields**: phone, birthday, username, location; password change endpoint

## Implemented (v1.0 — date: 2026-02-17)
- Auth: JWT email/password + Emergent Google OAuth, role selection at signup
- Splash + Onboarding (Turkish)
- Discover feed: TikTok-style vertical scroll snap, horizontal gallery per artist
- Moodboard (Panom): masonry grid of saved tattoos
- Tattoo DNA: heuristic style/color/size aggregation + match scoring
- Artist Profile: hero header, portfolio grid, ratings, comments, follow toggle
- Artist Dashboard (Stüdyo): upload tattoo, edit studio info, portfolio CRUD
- Right panel (desktop): stats, DNA mini-preview, best matches
- Seeded 6 real artists + demo user

## Core Schemas (MongoDB)
- `users`: user_id, email, password_hash, name, username, role, picture, bio, location, instagram, contact, studio_name, phone, birthday, auth_provider, created_at
- `tattoos`: tattoo_id, artist_id, image, description, tags[], style, color, size, created_at
- `likes` / `saves`: user_id, tattoo_id, artist_id, created_at
- `follows`: follower_id, artist_id, created_at
- `comments`: legacy
- `reviews`: review_id, artist_id, user_id, text, stars, photo, created_at
- `ratings`: legacy 1-5 star rating (aggregated with reviews)
- `verified_clients`: artist_id, user_id, verified_at
- `messages`: message_id, conversation_id (sorted user_ids), sender_id, receiver_id, content, created_at
- `sessions`: Emergent OAuth tokens

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
