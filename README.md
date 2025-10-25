# Google Cloud Engineering Demo

This repository contains a simple serverless text analysis service intended for Google Cloud demos. The `server/` directory packages an HTTP Cloud Function that counts characters, words, and unique words in a payload. The App Engine `app.yaml` file shows how a static frontend could be hosted alongside the function.

## Project Layout

- `server/index.js` – Cloud Function entry point and reusable text analytics helper.
- `server/package.json` – Function dependencies, local development scripts, and Node runtime constraint.
- `server/test/analyzeText.test.js` – Unit tests validating the analytics logic and HTTP handler.
- `server/release-server.sh` – Convenience script for deploying the function with the gcloud CLI.
- `web/index.js` – Express server that forwards requests to the Cloud Function.
- `web/release-web.sh` – Deploys the App Engine Standard service behind the Express proxy.
- `package.json` / `pnpm-workspace.yaml` – Workspace root configuration and shared scripts.
- `web/app.yaml` – App Engine configuration for serving the Express proxy.

## Prerequisites

- Node.js 22.x.
- `pnpm` (recommended) or `npm` for dependency management.
- Google Cloud CLI authenticated against the target project for deployment.

## Install Dependencies

```bash
pnpm install
```

This command installs dependencies for every workspace package (`server` and `web`).

## Run Locally

Use the Functions Framework to exercise the handler on your machine:

```bash
pnpm start:function
```

Then send a request (in a separate terminal):

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello hello world"}'
```

The response includes `wordCount`, `characterCount`, and `uniqueWordCount` fields.

## Run Tests

```bash
pnpm test
```

Tests cover the reusable analytics helper and the HTTP handler, including CORS and method handling.

## Run the Express Proxy

Launch a simple Express frontend that relays requests to the Cloud Function:

```bash
ANALYZE_FUNCTION_URL=https://REGION-PROJECT.cloudfunctions.net/analyzeText pnpm start:web
```

`ANALYZE_FUNCTION_URL` defaults to `http://localhost:8080` during local development, matching the Functions Framework dev server started via `pnpm start:function`. When `NODE_ENV=production`, the Express app automatically targets the deployed Cloud Function unless you override the environment variable. The proxy serves a basic HTML form at `http://localhost:3000` and also exposes a JSON endpoint at `/api/analyze`.

## Deploy the Cloud Function

```bash
cd server
./release-server.sh
```

The script deploys the `analyzeText` function as an HTTP Cloud Function in `us-central1` using the Node.js 22 runtime by default. It falls back to the `cloud-engineer-certify` project unless you supply a project id as the first argument or set `GOOGLE_CLOUD_PROJECT`. Extra arguments are forwarded to `gcloud functions deploy`; see `gcloud functions deploy --help` for options.

## Deploy the Web App

```bash
cd web
./release-web.sh
```

This command installs dependencies with `pnpm` when available (falling back to `npm`), then deploys `web/app.yaml` to App Engine Standard. The default project is `cloud-engineer-certify`; override it by passing a project id as the first argument or setting `GOOGLE_CLOUD_PROJECT`. Any additional arguments are appended to the `gcloud app deploy` invocation.

## Release Both Services

Run the combined release helper to deploy the Cloud Function first and then the App Engine app defined in `web/app.yaml`:

```bash
pnpm release
```

The script defaults to the `cloud-engineer-certify` project; override with `--project YOUR_GCP_PROJECT` if needed. Pass extra flags with `--server FLAG` or `--web FLAG` (repeat as needed) to forward them to the respective deployment commands. Ensure your App Engine application already exists in the desired region (for example, `gcloud app create --region=us-central1`) before running the release helper for the first time.

## App Engine Deployment Notes

`web/app.yaml` runs the Express proxy on App Engine Standard with the Node.js 22 runtime and automatic scaling between zero and one instance. No static build step is required for the current setup, but you can extend the handler configuration to serve compiled assets if you add a React or other SPA frontend later.

## Troubleshooting

- Ensure Node 22.x is installed; earlier runtimes do not support the optional chaining used by the handler and will fail the engine check.
- If CORS requests fail, verify that the caller sends an `OPTIONS` pre-flight request and that no custom headers beyond `Content-Type` are required. Update the handler if your UI needs additional headers or methods.
