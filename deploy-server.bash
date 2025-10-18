#!/usr/bin/env bash
set -euo pipefail

# Deploy the analyzeText Cloud Function. Additional gcloud flags can be passed through.
gcloud functions deploy analyzeText \
  --runtime=nodejs18 \
  --entry-point=analyzeTextHandler \
  --trigger-http \
  --allow-unauthenticated \
  --region=us-central1 \
  "$@"