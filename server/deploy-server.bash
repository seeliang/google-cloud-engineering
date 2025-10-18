#!/usr/bin/env bash
set -euo pipefail

# Deploy the analyzeText Cloud Function. Additional gcloud flags can be passed through.

# Default project used when none is provided explicitly.
DEFAULT_PROJECT="cloud-engineer-certify"

project_flag_supplied=false
for arg in "$@"; do
  case "$arg" in
    --project|--project=*)
      project_flag_supplied=true
      break
      ;;
  esac
done

if [[ ${project_flag_supplied} == false ]]; then
  default_project="${GCLOUD_PROJECT:-${GOOGLE_CLOUD_PROJECT:-${DEFAULT_PROJECT}}}"
  if [[ -z "${default_project}" ]]; then
    cat <<'EOF' >&2
Error: No Google Cloud project specified.
Pass --project PROJECT_ID to this script or set the GCLOUD_PROJECT or GOOGLE_CLOUD_PROJECT environment variable.
EOF
    exit 1
  fi
  set -- "--project=${default_project}" "$@"
fi

gcloud functions deploy analyzeText \
  --runtime=nodejs20 \
  --entry-point=analyzeTextHandler \
  --trigger-http \
  --allow-unauthenticated \
  --region=us-central1 \
  "$@"