# Vertex Gemini Client

Utility package that centralizes configuration for the Vertex AI Gemini 2.5 Flash text model. The client produces a pre-configured generative model instance that can be reused by Cloud Functions, App Engine apps, or CLIs within this monorepo.

## Configuration

Environment variables are read at runtime with sensible defaults defined in `src/config.json`:

| Variable | Default | Description |
| --- | --- | --- |
| `GOOGLE_CLOUD_PROJECT` | `your-cloud-project` | Google Cloud project id used when instantiating the Vertex AI client. |
| `VERTEX_LOCATION` | `us-central1` | Regional endpoint for Vertex AI requests. |
| `VERTEX_MODEL` | `gemini-2.5-flash` | Gemini model identifier. |
| `VERTEX_SYSTEM_INSTRUCTION_PARTS` | `[{"text":"You are a helpful customer service agent."}]` | JSON string describing the system instruction parts array. |
| `VERTEX_SYSTEM_INSTRUCTION` | `You are a helpful customer service agent.` | Fallback single string converted into a one-part instruction when the parts JSON is not provided. |
| `VERTEX_MAX_OUTPUT_TOKENS` | `512` | Maximum tokens returned by the model. |
| `VERTEX_TEMPERATURE` | `0.3` | Sampling temperature. |
| `VERTEX_TOP_P` | `0.95` | Nucleus sampling probability. |
| `VERTEX_TOP_K` | `40` | Candidate selection window size. |

All values can be overridden per-call by passing overrides into `getGenerativeModel`.

## Usage

```javascript
const { getGenerativeModel } = require('vertex-gemini-client');

const generativeModel = getGenerativeModel();

const result = await generativeModel.generateContent({
  contents: [{ role: 'user', parts: [{ text: 'Summarize our refund policy.' }] }]
});

// Override system instruction parts in code
const withCustomInstruction = getGenerativeModel({
  systemInstructionParts: [
    { text: 'You answer billing questions only.' },
    { text: 'Decline to discuss account cancellations.' }
  ]
});
```

### Run From JSON

Load overrides and request payload from disk by using the helper script:

```bash
node scripts/runFromConfig.js ./prompt-request.json
```

Example JSON file:

```json
{
  "model": "gemini-1.5-flash",
  "overrides": {
    "systemInstructionParts": [
      { "text": "You are an internal support agent." }
    ]
  },
  "request": {
    "contents": [
      { "role": "user", "parts": [{ "text": "Draft a welcome email." }] }
    ]
  }
}
```

You can start with `scripts/sample-request.json`:

```bash
node scripts/runFromConfig.js scripts/sample-request.json
```

The script writes a timestamped JSON report to `vertex/gemini-client/reports/` capturing the resolved configuration, request payload, response, and any errors.

If you are relying on user credentials instead of a service account, you may need to establish Application Default Credentials first:

```bash
gcloud auth application-default login
```

## Scripts

- `pnpm lint` – run ESLint across source and test files.
- `pnpm test` – execute unit tests with `node:test`.

Install dependencies from the workspace root:

```bash
pnpm install
```
