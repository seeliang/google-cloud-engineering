const {
    HarmBlockThreshold,
    HarmCategory
} = require('@google-cloud/vertexai');
const baseConfig = require('./config.json');

const DEFAULT_PROJECT = baseConfig.project;
const DEFAULT_LOCATION = baseConfig.location;
const DEFAULT_MODEL = baseConfig.model;

const DEFAULT_SYSTEM_INSTRUCTION_PARTS = Object.freeze(
    baseConfig.systemInstructionParts.map((part) => Object.freeze({ ...part }))
);

const DEFAULT_GENERATION_CONFIG = Object.freeze({
    ...baseConfig.generationConfig
});

const DEFAULT_SAFETY_SETTINGS = Object.freeze(
    baseConfig.safetySettings.map((setting) => Object.freeze({
        category: resolveEnumValue(HarmCategory, setting.category),
        threshold: resolveEnumValue(HarmBlockThreshold, setting.threshold)
    }))
);

function buildConfig(overrides = {}) {
    const config = {
        project: resolveString('GOOGLE_CLOUD_PROJECT', overrides.project, DEFAULT_PROJECT),
        location: resolveString('VERTEX_LOCATION', overrides.location, DEFAULT_LOCATION),
        model: resolveString('VERTEX_MODEL', overrides.model, DEFAULT_MODEL),
        systemInstructionParts: resolveSystemInstructionParts(overrides),
        safetySettings: cloneSafetySettings(
            Array.isArray(overrides.safetySettings) && overrides.safetySettings.length > 0
                ? overrides.safetySettings
                : DEFAULT_SAFETY_SETTINGS
        ),
        generationConfig: {
            ...DEFAULT_GENERATION_CONFIG
        }
    };

    applyGenerationEnv(config.generationConfig);

    if (overrides.generationConfig) {
        Object.assign(config.generationConfig, sanitizeGenerationOverrides(overrides.generationConfig));
    }

    return config;
}

function resolveString(envKey, overrideValue, fallback) {
    if (typeof overrideValue === 'string' && overrideValue.trim()) {
        return overrideValue.trim();
    }

    const envValue = process.env[envKey];
    if (typeof envValue === 'string' && envValue.trim()) {
        return envValue.trim();
    }

    return fallback;
}

function cloneSafetySettings(settings) {
    return settings.map((setting) => ({ ...setting }));
}

function resolveSystemInstructionParts(overrides) {
    const candidates = [
        overrides.systemInstructionParts,
        overrides.systemInstruction,
        tryParseJSON(process.env.VERTEX_SYSTEM_INSTRUCTION_PARTS),
        process.env.VERTEX_SYSTEM_INSTRUCTION,
        DEFAULT_SYSTEM_INSTRUCTION_PARTS
    ];

    for (const candidate of candidates) {
        const parts = normalizeParts(candidate);
        if (parts) {
            return cloneParts(parts);
        }
    }

    return cloneParts(DEFAULT_SYSTEM_INSTRUCTION_PARTS);
}

function normalizeParts(value) {
    if (Array.isArray(value) && value.length > 0) {
        return value;
    }

    if (value && typeof value === 'object' && Array.isArray(value.parts) && value.parts.length > 0) {
        return value.parts;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
            return [{ text: trimmed }];
        }
    }

    return undefined;
}

function cloneParts(parts) {
    return parts.map((part) => ({ ...part }));
}

function tryParseJSON(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return undefined;
    }

    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

function applyGenerationEnv(target) {
    applyNumberEnv(target, 'VERTEX_MAX_OUTPUT_TOKENS', 'maxOutputTokens', true);
    applyNumberEnv(target, 'VERTEX_TEMPERATURE', 'temperature');
    applyNumberEnv(target, 'VERTEX_TOP_P', 'topP');
    applyNumberEnv(target, 'VERTEX_TOP_K', 'topK', true);
}

function applyNumberEnv(target, envKey, property, asInteger = false) {
    const value = parseNumeric(process.env[envKey], asInteger);
    if (value !== undefined) {
        target[property] = value;
    }
}

function sanitizeGenerationOverrides(overrides) {
    const sanitized = {};
    const allowed = {
        maxOutputTokens: true,
        temperature: false,
        topP: false,
        topK: true
    };

    for (const [key, asInteger] of Object.entries(allowed)) {
        if (overrides[key] === undefined) {
            continue;
        }

        const value = parseNumeric(overrides[key], asInteger);
        if (value !== undefined) {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

function parseNumeric(value, asInteger) {
    if (value === undefined || value === null) {
        return undefined;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return undefined;
    }

    return asInteger ? Math.trunc(numeric) : numeric;
}

function resolveEnumValue(enumObject, value) {
    if (value === undefined || value === null) {
        return value;
    }

    if (Object.values(enumObject).includes(value)) {
        return value;
    }

    if (enumObject[value] !== undefined) {
        return enumObject[value];
    }

    return value;
}

module.exports = {
    DEFAULT_PROJECT,
    DEFAULT_LOCATION,
    DEFAULT_MODEL,
    DEFAULT_SAFETY_SETTINGS,
    DEFAULT_GENERATION_CONFIG,
    DEFAULT_SYSTEM_INSTRUCTION_PARTS,
    buildConfig
};
