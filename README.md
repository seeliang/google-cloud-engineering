# Google Cloud Engineering Demo

This repository contains a simple serverless text analysis service intended for Google Cloud demos. The `server/` directory packages an HTTP Cloud Function that counts characters, words, and unique words in a payload. The App Engine `app.yaml` file shows how a static frontend could be hosted alongside the function.

## Project Layout

- `server/index.js` – Cloud Function entry point and reusable text analytics helper.
- `server/package.json` – Function dependencies, local development scripts, and Node runtime constraint.
- `server/test/analyzeText.test.js` – Unit tests validating the analytics logic and HTTP handler.
- `deploy-server.bash` – Convenience script for deploying the function with the gcloud CLI.
- `app.yaml` – Sample App Engine configuration for serving a static UI.

## Prerequisites

- Node.js 18 or newer.
- `pnpm` (recommended) or `npm` for dependency management.
- Google Cloud CLI authenticated against the target project for deployment.

## Install Dependencies

```bash
cd server
pnpm install
```

> Replace `pnpm` with `npm` if you prefer the default Node package manager.

## Run Locally

Use the Functions Framework to exercise the handler on your machine:

```bash
pnpm start
```

Then send a request:

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

## Deploy the Cloud Function

```bash
cd server
../deploy-server.bash \
  --project YOUR_GCP_PROJECT
```

The script deploys the `analyzeText` function as an HTTP Cloud Function in `us-central1`. You can pass additional flags (for example `--entry-point` or `--runtime`) as needed; see `gcloud functions deploy --help` for options.

## App Engine Static Hosting

The root-level `app.yaml` configures Node.js 22 on App Engine Standard to serve static files from a `build/` directory. If you build a frontend separately, copy its output into `build/` before deploying with `gcloud app deploy`.

## Troubleshooting

- Ensure Node 18+ is installed; earlier runtimes do not support the optional chaining used by the handler.
- If CORS requests fail, verify that the caller sends an `OPTIONS` pre-flight request and that no custom headers beyond `Content-Type` are required. Update the handler if your UI needs additional headers or methods.
