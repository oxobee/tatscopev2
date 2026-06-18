# Deploy backend to Render (step-by-step)

This guide walks through deploying the `backend/` service to Render and wiring MongoDB Atlas.

## 1) Create MongoDB Atlas cluster

1. Sign up / log in to https://www.mongodb.com/cloud/atlas
2. Create a free Shared Cluster (e.g. `Cluster0`) in a region near your users
3. Create a database user (username + password)
4. Network Access: add IP 0.0.0.0/0 temporarily or your Render region IPs
5. Get the connection string ("Connect your application") — copy the `mongodb+srv://...` URI
6. Replace the password placeholder and database name:

```
MONGO_URL=mongodb+srv://<user>:<password>@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=tattoomatch
```

## 2) Connect your GitHub repo to Render

1. Go to https://dashboard.render.com
2. New → Web Service
3. Select your repository (this repo) and branch (e.g. `main`)
4. Environment: **Docker** (Render will build using `render.yaml` / `backend/Dockerfile`)
5. Name: `tattoomatch-backend` (or as you prefer)
6. Auto Deploy: enabled

## 3) Set environment variables on Render

In the service settings (Environment tab) add the following env vars:

- `MONGO_URL` → full Atlas connection string
- `DB_NAME` → `tattoomatch`
- `JWT_SECRET` → long random secret (keep private)

Do NOT commit `.env` to the repo.

## 4) Deploy

- After you create the service and set the env vars, Render will build and deploy the service.
- The backend will be available at `https://<service>.onrender.com` (copy the URL from Render dashboard).

## 5) Wire frontend (Vercel)

- Update `REACT_APP_BACKEND_URL` in your Vercel project to the Render service URL (without trailing slash), e.g. `https://tattoomatch-backend.onrender.com`
- Redeploy the frontend via Vercel dashboard or CLI.

CLI example to set a Vercel env (interactive):

```bash
# interactive flow
vercel env add REACT_APP_BACKEND_URL production
# then run
vercel --prod
```

Or set via Vercel dashboard → Project → Settings → Environment Variables.

## 6) (Optional) Seed data

SSH / run the `backend/seed.py` script locally (it writes to the configured MongoDB):

```bash
# locally (uses backend/.env values)
cd backend
source .venv/bin/activate
python seed.py
```

Alternatively run a one-off job on Render referencing your repo/branch to execute the seed script.

---

If you want, I can:

- Create the Render service automatically if you provide a Render API key, or
- Walk you through the Atlas cluster creation step-by-step and set Render envs if you grant access.

Which parts should I perform for you now (I can prepare and push any necessary files, or execute API-driven deploys if you provide the needed API tokens)?
