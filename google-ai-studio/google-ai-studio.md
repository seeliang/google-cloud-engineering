# Google AI Studio

## Goal
Validate the Google AI Studio service end-to-end, capture learnings, and document integration handoffs for broader rollout.

## Prerequisites
- Run `pnpm install` in the repo root and confirm the `google-ai-studio` service deploys with mock credentials.
- Populate `credential.json` in the repo root (copy `credential.example.json`) with the AI Studio API key and Google AI Studio service auth token, or export them via `GOOGLE_AI_STUDIO_API_KEY` for CI runs.

## Call Google AI Studio
- **Credential Frame:** Store the Google AI Studio API key in the root folder `credential.json` (or export `GOOGLE_AI_STUDIO_API_KEY`) and use it when exercising the REST endpoint below to confirm baseline connectivity.
	```bash
	curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
		-H 'Content-Type: application/json' \
		-H 'X-goog-api-key: YOUR_API_KEY_HERE' \
		-X POST \
		-d '{
			"contents": [
				{
					"parts": [
						{
							"text": "Explain how AI works in a few words"
						}
					]
				}
			]
		}'
	```
- **Result capture:** The Node utility writes the last response to `results/latest-response.json` (configurable via `AI_API_OUTPUT_PATH`) for later analysis.

