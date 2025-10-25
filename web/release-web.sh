#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_PROJECT_ID="cloud-engineer-certify"
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$DEFAULT_PROJECT_ID}"

if [[ $# -gt 0 ]]; then
  PROJECT_ID="$1"
  shift
fi

EXTRA_ARGS=("$@")

if [[ -z "${PROJECT_ID}" ]]; then
  cat <<'EOF' >&2
Usage: ./release-web.sh [PROJECT_ID] [additional gcloud flags]
Either pass the project id explicitly or set GOOGLE_CLOUD_PROJECT.
EOF
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install the Google Cloud SDK first."
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  if [[ -f pnpm-lock.yaml ]]; then
    pnpm install --frozen-lockfile
  else
    pnpm install
  fi
elif command -v npm >/dev/null 2>&1; then
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
else
  echo "Neither pnpm nor npm was found in PATH."
  exit 1
fi

DEPLOY_CMD=(
  gcloud
  app
  deploy
  web/app.yaml
  --project="${PROJECT_ID}"
  --quiet
)

if ((${#EXTRA_ARGS[@]})); then
  DEPLOY_CMD+=("${EXTRA_ARGS[@]}")
fi

"${DEPLOY_CMD[@]}"