# Vertex AI Project Plan

## Overview
- Build a customer service assistant using the Google Vertex AI Gemini 2.5 Flash text model.
- Ensure safe content generation via Vertex AI safety settings and configurable system instructions.
- Deploy server-side logic within the existing Google Cloud engineering workspace, integrating with other services as needed.

## Objectives
- Provision Vertex AI resources in project `your-cloud-project` located in `us-central1`.
- Implement a reusable client wrapper that instantiates the Gemini model with predefined safety and generation parameters.
- Enable continuous integration and testing pipelines to validate prompt changes and safety compliance.

## High-Level Architecture
1. **Vertex AI**: Hosts Gemini 2.5 Flash text model for prompt-response workflows.
2. **Application Layer**: Node.js services (e.g., Cloud Functions, Cloud Run, or App Engine) leverage the Vertex AI client.
3. **Data Layer**: Optional storage in Cloud Storage / Firestore for prompt templates and conversation logs.
4. **Observability**: Cloud Logging + Cloud Monitoring dashboards for latency, token usage, and error tracking.

## Environment Setup
- Enable the Vertex AI API and ensure IAM roles `roles/aiplatform.user` and `roles/aiplatform.admin` are assigned to service accounts used by the Node.js runtime.
- Configure service account keys or Workload Identity Federation for secure authentication.
- Install the Node.js Vertex AI SDK via `pnpm add @google-cloud/vertexai` (workspace already uses pnpm).
- Define environment variables: `GOOGLE_CLOUD_PROJECT`, `VERTEX_LOCATION`, `VERTEX_MODEL` (default `gemini-2.5-flash`).

## Reference Implementation
```javascript
const {
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI
} = require('@google-cloud/vertexai');

const project = process.env.GOOGLE_CLOUD_PROJECT || 'your-cloud-project';
const location = process.env.VERTEX_LOCATION || 'us-central1';
const textModel = process.env.VERTEX_MODEL || 'gemini-2.5-flash';

const vertexAI = new VertexAI({ project, location });

// Instantiate Gemini models
const generativeModel = vertexAI.getGenerativeModel({
  model: textModel,
  // Optional parameters set defaults for downstream requests
  safetySettings: [{
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  }],
  generationConfig: { maxOutputTokens: 256 },
  systemInstruction: {
    role: 'system',
    parts: [{ text: 'For example, you are a helpful customer service agent.' }],
  },
});
```

## Milestones & Tasks
1. **Foundational Setup**
   - Confirm billing enabled, Vertex AI API activated, and location quotas sufficient.
   - Create service accounts, assign IAM roles, and configure secrets management (Secret Manager or environment variables).
2. **Development**
   - Build a lightweight client module (e.g., `vertexClient.js`) that exports `generativeModel` and higher-level helpers.
   - Add unit tests mocking the Vertex AI SDK to validate prompt assembly and safety settings.
3. **Integration**
   - Wire the client into existing applications (App Engine, Cloud Functions, or AI Studio tooling) through dependency injection.
   - Implement request/response logging with sensitive data redaction.
4. **Quality & Safety**
   - Establish automated prompt evaluation tests (e.g., golden responses) and safety regression checks.
   - Configure Vertex AI monitoring to flag safety threshold triggers.
5. **Deployment & Operations**
   - Create deployment scripts (pnpm scripts or Cloud Build CI pipelines) to promote changes across environments.
   - Set up Cloud Monitoring dashboards and alerting for latency, quota usage, and errors.

## Testing Strategy
- **Unit Tests**: Mock Vertex AI client to ensure configuration and prompt wrappers behave as expected.
- **Integration Tests**: Use Vertex AI emulator or limited quota environment to validate real responses.
- **Safety Reviews**: Periodically review prompt outputs against policy guidelines and adjust thresholds.

## Risk & Mitigation
- **Quota Exhaustion**: Monitor usage metrics; set per-project quotas and alerts.
- **Safety Violations**: Continuous tuning of safety settings; add custom filters post-response.
- **Cost Overruns**: Capture token usage, enforce rate limiting, and regularly audit logs.

## Next Steps
- Update `google-ai-studio/src` to import the Vertex AI client wrapper.
- Document operational runbooks in `docs/vertex-operations.md` with troubleshooting steps and escalation paths.
- Schedule review checkpoints for prompt quality and safety configuration updates.
