# Deployment

Rebulb StoryAtlas is a single Docker image that serves both the React SPA and the Flask API on the same origin. Production target is **Fly.io** because it gives us a cheap persistent volume (for SQLite) and automatic HTTPS.

## First-time setup (one-off)

```bash
# 1. Install flyctl — https://fly.io/docs/hands-on/install-flyctl/
# 2. Log in
fly auth login

# 3. Create the app (uses fly.toml in this directory)
cd rebulb-storyatlas
fly launch --no-deploy --copy-config --name rebulb-storyatlas --region iad

# 4. Create the persistent volume for SQLite + auto-backups
fly volumes create rebulb_data --size 1 --region iad

# 5. Set secrets
fly secrets set WORLDFORGE_SECRET_KEY=$(openssl rand -hex 32)
fly secrets set SENTRY_DSN="https://...@sentry.io/..."   # optional

# 6. (Optional) wire CI deploys
gh secret set FLY_API_TOKEN --body "$(fly auth token)"
```

## Day-to-day deploys

Push to `main` on GitHub — the `Deploy to Fly.io` workflow runs `flyctl deploy --remote-only`. Or deploy locally:

```bash
cd rebulb-storyatlas
fly deploy
fly logs       # tail machine logs
fly status     # check health
```

## Verifying a deploy

```bash
curl https://rebulb-storyatlas.fly.dev/api/health        # {"ok":true,"version":"<sha>"}
curl https://rebulb-storyatlas.fly.dev/api/metrics       # entry counts + db size
curl https://rebulb-storyatlas.fly.dev/                  # SPA HTML
```

A save survives restarts:

```bash
curl -X POST https://rebulb-storyatlas.fly.dev/api/characters \
  -H 'Content-Type: application/json' \
  -d '{"name":"persist-test"}'

fly machines restart
curl https://rebulb-storyatlas.fly.dev/api/all | grep persist-test
```

## Local container parity

```bash
cd rebulb-storyatlas
docker compose up --build       # http://localhost:8080
# DB persists at ./data/worldforge.db across restarts
```

## Backups

- The backend writes a JSON snapshot into `$WORLDFORGE_BACKUP_DIR` before every destructive import, keeping the 10 most recent.
- Fly.io volumes are snapshotted daily automatically; see `fly volumes snapshots list rebulb_data`.
- To pull a manual backup: `fly ssh console -C "tar czf - /data" > backup-$(date +%F).tar.gz`

## Why not Vercel?

Previous Vercel deploys failed silently because Vercel auto-detected the Vite project and built the SPA fine, but the serverless runtime never ran `backend/app.py`. Every page load hit a missing API. Saves never reached a Flask process because no Flask process existed. Long-running SQLite + a Python app does not fit Vercel's model — so we moved the Python tier to a container host with a real filesystem.
