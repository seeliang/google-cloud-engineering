#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_PROJECT_ID="cloud-engineer-certify"
PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-$DEFAULT_PROJECT_ID}}"

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

gcloud app deploy  web/app.yaml --project "$PROJECT_ID" --quiet