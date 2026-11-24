#!/bin/bash
# Daily dataset refresh, used by the launchd job when GitHub Actions cannot run.
# Pulls the feeds, commits public/jobs.json if it changed, and pushes to origin.
set -uo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
BUN="${FREEBUFF_BUN:-/Applications/Freebuff.app/Contents/Resources/bun/bun}"
export PATH="$(dirname "$BUN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export GIT_TERMINAL_PROMPT=0

cd "$REPO" || exit 1

echo "[$(date -u +%FT%TZ)] refreshing job dataset"

if ! "$BUN" scripts/ingest.ts; then
  echo "[$(date -u +%FT%TZ)] ingest failed; keeping the committed dataset"
  exit 1
fi

if git diff --quiet -- public/jobs.json; then
  echo "[$(date -u +%FT%TZ)] dataset unchanged; nothing to commit"
  exit 0
fi

git add public/jobs.json || exit 1
git -c user.name="first-rung refresh bot" \
    -c user.email="khhnabubakar786@gmail.com" \
    commit -m "chore: refresh job dataset ($(date -u +%Y-%m-%d))" || exit 1
git push origin HEAD || { echo "[$(date -u +%FT%TZ)] push failed"; exit 1; }

echo "[$(date -u +%FT%TZ)] dataset refreshed and pushed"

# Publish the refreshed dataset. The commit above is history; this is what
# changes what visitors actually see.
if ! "$BUN" run build; then
  echo "[$(date -u +%FT%TZ)] build failed; the live site was left on the previous build"
  exit 1
fi

if ! ./node_modules/.bin/wrangler deploy --config wrangler.deploy.jsonc; then
  echo "[$(date -u +%FT%TZ)] deploy failed; check CLOUDFLARE_API_TOKEN or run: npx wrangler login"
  exit 1
fi

echo "[$(date -u +%FT%TZ)] live site redeployed"
