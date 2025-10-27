#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

DEFAULT_PROJECT_ID="cloud-engineer-certify"
DEFAULT_REGION="us-central1"
FUNCTION_NAME="analyzeText"
ENTRY_POINT="analyzeTextHandler"
RUNTIME="nodejs22"

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-${DEFAULT_PROJECT_ID}}"

if [[ $# -gt 0 ]]; then
  PROJECT_ID="$1"
  shift
fi

EXTRA_ARGS=("$@")

if [[ -z "${PROJECT_ID}" ]]; then
  cat <<'EOF' >&2
Usage: ./release-cloud-function.sh [PROJECT_ID] [additional gcloud flags]
Either pass the project id explicitly or set GOOGLE_CLOUD_PROJECT.
EOF
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install the Google Cloud SDK first." >&2
  exit 1
fi

REGION="${FUNCTION_REGION:-${DEFAULT_REGION}}"

# Deploy the HTTP-triggered Cloud Function with tight auto-scaling limits.
DEPLOY_CMD=(
  gcloud functions deploy "${FUNCTION_NAME}"
  --runtime="${RUNTIME}"
  --entry-point="${ENTRY_POINT}"
  --trigger-http
  --allow-unauthenticated
  --region="${REGION}"
  --project="${PROJECT_ID}"
  --min-instances=0
  --max-instances=1
  --quiet
)

if ((${#EXTRA_ARGS[@]})); then
  DEPLOY_CMD+=("${EXTRA_ARGS[@]}")
fi

"${DEPLOY_CMD[@]}"
