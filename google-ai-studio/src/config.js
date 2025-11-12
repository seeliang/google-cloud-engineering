import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'models/gemini-2.0-flash';

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
    const fallback = path.resolve(process.cwd(), 'results/latest-response.json');
    if (!rawValue) {
        return fallback;
    }
    if (path.isAbsolute(rawValue)) {
        return rawValue;
    }
    return path.resolve(process.cwd(), rawValue);
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
