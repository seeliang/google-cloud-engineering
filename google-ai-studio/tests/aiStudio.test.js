import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { describe, it, mock } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { buildRequestPayload, generateContent, run } from '../src/aiStudioClient.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'models/gemini-2.0-flash';

describe('buildRequestPayload', () => {
    it('wraps text in the parts structure expected by the API', () => {
        const payload = buildRequestPayload('Hello AI');
        assert.deepEqual(payload, {
            contents: [
                {
                    parts: [
                        {
                            text: 'Hello AI',
                        },
                    ],
                },
            ],
        });
    });
});

describe('generateContent', () => {
    it('posts to the model endpoint with the API key and prompt payload', async () => {
        const fakeResponse = {
            status: 200,
            json: async () => ({ candidates: [] }),
        };

        const fetchMock = mock.fn(async (url, options) => {
            assert.equal(url, `${BASE_URL}/${MODEL}:generateContent`);
            assert.equal(options.method, 'POST');
            assert.equal(options.headers['X-goog-api-key'], 'test-key');
            const parsed = JSON.parse(options.body);
            assert.equal(parsed.contents[0].parts[0].text, 'Ping');
            return fakeResponse;
        });

        const result = await generateContent({
            fetchImpl: fetchMock,
            baseUrl: BASE_URL,
            model: MODEL,
            apiKey: 'test-key',
            prompt: 'Ping',
        });

        assert.deepEqual(result, { candidates: [] });
        assert.equal(fetchMock.mock.callCount(), 1);
    });

    it('throws when the service responds with a non-success status', async () => {
        const fetchMock = mock.fn(async () => ({
            status: 403,
            text: async () => 'Forbidden',
        }));

        await assert.rejects(
            generateContent({
                fetchImpl: fetchMock,
                baseUrl: BASE_URL,
                model: MODEL,
                apiKey: 'broken',
                prompt: 'Ping',
            }),
            /403.*Forbidden/
        );
    });
});

describe('run', () => {
    it('writes the result to disk when an output path is supplied', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-'));
        const outputPath = path.join(tempDir, 'response.json');

        const fetchMock = mock.fn(async () => ({
            status: 200,
            json: async () => ({ candidates: [{ content: 'ok' }] }),
        }));

        const logger = {
            info: mock.fn(),
            error: mock.fn(),
            warn: mock.fn(),
        };

        const result = await run({
            fetchImpl: fetchMock,
            baseUrl: BASE_URL,
            model: MODEL,
            apiKey: 'test-key',
            prompt: 'Ping',
            outputPath,
            logger,
        });

        assert.deepEqual(result, { candidates: [{ content: 'ok' }] });
        const saved = JSON.parse(await fs.readFile(outputPath, 'utf-8'));
        assert.deepEqual(saved, { candidates: [{ content: 'ok' }] });
        assert.equal(logger.error.mock.callCount(), 0);
    });
});
