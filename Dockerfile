# syntax=docker/dockerfile:1.7

# ---- Stage 1: build the SPA ----
FROM node:20-alpine AS spa
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json vite.config.ts vitest.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Stage 2: Python runtime ----
FROM python:3.11-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080 \
    WORLDFORGE_DB_PATH=/data/worldforge.db \
    WORLDFORGE_BACKUP_DIR=/data/backups \
    REBULB_DIST_OVERRIDE=/app/dist \
    APP_ENV=production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend
COPY --from=spa /build/dist ./dist

# A non-root user; /data is the persisted volume in production.
RUN addgroup --system rebulb \
    && adduser --system --ingroup rebulb --home /home/rebulb rebulb \
    && mkdir -p /data/backups \
    && chown -R rebulb:rebulb /data /app

USER rebulb
WORKDIR /app/backend

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers ${GUNICORN_WORKERS:-2} --threads ${GUNICORN_THREADS:-4} --timeout ${GUNICORN_TIMEOUT:-60} --access-logfile - --error-logfile - wsgi:application"]
