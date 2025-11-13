import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SUCCESS_STATUS = 200;

export function buildRequestPayload(text) {
    return {
        contents: [
            {
                parts: [
                    {
                        text,
                    },
                ],
            },
        ],
    };
}

export async function generateContent({
    fetchImpl = fetch,
    baseUrl,
    model,
    apiKey,
    prompt,
    extraHeaders = {},
}) {
    if (!prompt) {
        throw new Error('Prompt text is required');
    }

    const endpoint = `${baseUrl}/${model}:generateContent`;

    const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
            ...extraHeaders,
        },
        body: JSON.stringify(buildRequestPayload(prompt)),
        signal: AbortSignal.timeout(30_000),
    });

    if (response.status !== SUCCESS_STATUS) {
        const body = await response.text();
        throw new Error(`AI Studio request failed (${response.status}): ${body}`);
    }

    return response.json();
}

export async function run({
    fetchImpl = fetch,
    prompt = 'Explain what is the full name of this javascript, and what is it doing in within 70 words',
    logger = console,

    outputPath,
    ...config
}) {
    try {
        const result = await generateContent({ fetchImpl, prompt, ...config });
        await persistResult({ outputPath, result, logger });
        logger.info('AI Studio response received', {
            prompt,
            result,
            outputPath,
        });
        return result;
    } catch (error) {
        logger.error('AI Studio request failed', {
            prompt,
            error: error instanceof Error ? error.message : String(error),
        });
        if (process.env.CI) {
            throw error;
        }
        return null;
    }
}

async function persistResult({ outputPath, result, logger }) {
    if (!outputPath) {
        return;
    }

    try {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (logger && typeof logger.warn === 'function') {
            logger.warn('Failed to persist AI Studio response', {
                outputPath,
                error: message,
            });
        }
        return;
    }

    if (logger && typeof logger.info === 'function') {
        logger.info('AI Studio response saved to disk', {
            outputPath,
        });
    }
}
