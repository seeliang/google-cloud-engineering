#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-cloud-engineer-certify}"
INSTANCE_NAME="${INSTANCE_NAME:-gae-private-db}"
REGION="${REGION:-us-central1}"
NETWORK="${NETWORK:-default}"
RANGE_NAME="${RANGE_NAME:-google-managed-services-${NETWORK}}"

gcloud config set project "${PROJECT_ID}"

# Ensure the private service connection prerequisites exist before creating the instance.
if ! gcloud services list --enabled --filter="config.name:servicenetworking.googleapis.com" --format="value(config.name)" | grep -q servicenetworking.googleapis.com; then
  gcloud services enable servicenetworking.googleapis.com
fi

if ! gcloud compute addresses describe "${RANGE_NAME}" --global --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute addresses create "${RANGE_NAME}" \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --network="${NETWORK}"
fi

if ! gcloud services vpc-peerings list --project "${PROJECT_ID}" --network="projects/${PROJECT_ID}/global/networks/${NETWORK}" --format="value(name)" | grep -q servicenetworking; then
  gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --network="projects/${PROJECT_ID}/global/networks/${NETWORK}" \
    --ranges="${RANGE_NAME}" \
    --project "${PROJECT_ID}"
fi

gcloud sql instances create "${INSTANCE_NAME}" \
  --database-version=POSTGRES_14 \
  --region="${REGION}" \
  --cpu=1 \
  --memory=4GB \
  --no-assign-ip \
  --database-flags=cloudsql.iam_authentication=On \
  --network="projects/${PROJECT_ID}/global/networks/${NETWORK}"