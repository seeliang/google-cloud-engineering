import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'models/gemini-2.5-flash';

const FILE_ENCODING = 'utf-8';

function readJsonIfExists(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, FILE_ENCODING));
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

function resolveFromCredentialFile() {
    const overridePath = process.env.GOOGLE_AI_STUDIO_CREDENTIAL_PATH;
    const defaultPath = path.resolve(process.cwd(), '../credential.json');
    const targetPath = overridePath ? path.resolve(process.cwd(), overridePath) : defaultPath;
    return readJsonIfExists(targetPath);
}

function resolveOutputPath(rawValue) {
    const placeholder = '%DATE%';
    const pattern = rawValue ?? 'results/ai-response-%DATE%.json';

    const resolvedPattern = path.isAbsolute(pattern)
        ? pattern
        : path.resolve(process.cwd(), pattern);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const occurrences = (resolvedPattern.match(new RegExp(placeholder, 'g')) ?? []).length;

    if (occurrences > 1) {
        throw new Error('Configured AI_API_OUTPUT_PATH must not contain multiple %DATE% placeholders.');
    }

    if (occurrences === 1) {
        return resolvedPattern.replace(placeholder, timestamp);
    }

    const parsed = path.parse(resolvedPattern);
    const baseName = parsed.name || 'ai-response';
    const extension = parsed.ext || '.json';
    const filename = `${baseName}-${timestamp}${extension}`;
    const directory = parsed.dir || process.cwd();
    return path.join(directory, filename);
}

export function loadConfig() {
    const envFile = path.resolve(process.cwd(), 'env.local.json');
    const envConfig = readJsonIfExists(envFile);
    const credentialFile = resolveFromCredentialFile();

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY
        ?? envConfig.GOOGLE_AI_STUDIO_API_KEY
        ?? credentialFile.GOOGLE_AI_STUDIO_API_KEY;

    if (!apiKey) {
        throw new Error('Missing GOOGLE_AI_STUDIO_API_KEY in environment, env.local.json, or credential.json');
    }

    return {
        apiKey,
        authToken: process.env.AI_API_AUTH_TOKEN ?? envConfig.AI_API_AUTH_TOKEN ?? credentialFile.AI_API_AUTH_TOKEN,
        baseUrl: process.env.AI_API_BASE_URL ?? envConfig.AI_API_BASE_URL ?? DEFAULT_BASE_URL,
        model: process.env.AI_API_MODEL ?? envConfig.AI_API_MODEL ?? DEFAULT_MODEL,
        outputPath: resolveOutputPath(process.env.AI_API_OUTPUT_PATH ?? envConfig.AI_API_OUTPUT_PATH),
    };
}
