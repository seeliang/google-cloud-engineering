const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildConfig,
    defaultProject,
    defaultLocation,
    defaultModel,
    defaultGenerationConfig,
    defaultSafetySettings,
    defaultSystemInstructionParts,
    getGenerativeModel
} = require('../src');

test('buildConfig falls back to defaults and clones arrays', (t) => {
    const config = buildConfig();

    assert.strictEqual(config.project, defaultProject);
    assert.strictEqual(config.location, defaultLocation);
    assert.strictEqual(config.model, defaultModel);

    assert.notStrictEqual(config.safetySettings, defaultSafetySettings);
    assert.deepEqual(config.safetySettings, defaultSafetySettings);

    assert.notStrictEqual(config.generationConfig, defaultGenerationConfig);
    assert.deepEqual(config.generationConfig, defaultGenerationConfig);

    assert.notStrictEqual(config.systemInstructionParts, defaultSystemInstructionParts);
    assert.deepEqual(config.systemInstructionParts, defaultSystemInstructionParts);

    for (const setting of config.safetySettings) {
        assert.ok(Object.prototype.hasOwnProperty.call(setting, 'category'));
        assert.ok(Object.prototype.hasOwnProperty.call(setting, 'threshold'));
    }

    for (const [index, part] of config.systemInstructionParts.entries()) {
        assert.deepEqual(part, defaultSystemInstructionParts[index]);
        assert.notStrictEqual(part, defaultSystemInstructionParts[index]);
    }
});

test('buildConfig merges environment variables and overrides', (t) => {
    const cleanups = rememberEnv([
        'GOOGLE_CLOUD_PROJECT',
        'VERTEX_LOCATION',
        'VERTEX_MODEL',
        'VERTEX_SYSTEM_INSTRUCTION',
        'VERTEX_SYSTEM_INSTRUCTION_PARTS',
        'VERTEX_MAX_OUTPUT_TOKENS',
        'VERTEX_TEMPERATURE',
        'VERTEX_TOP_P',
        'VERTEX_TOP_K'
    ]);

    process.env.GOOGLE_CLOUD_PROJECT = 'env-project';
    process.env.VERTEX_LOCATION = 'europe-west4';
    process.env.VERTEX_MODEL = 'gemini-pro';
    process.env.VERTEX_SYSTEM_INSTRUCTION = 'Env instruction.';
    process.env.VERTEX_SYSTEM_INSTRUCTION_PARTS = JSON.stringify([
        { text: 'Env part 1' },
        { text: 'Env part 2' }
    ]);
    process.env.VERTEX_MAX_OUTPUT_TOKENS = '1024';
    process.env.VERTEX_TEMPERATURE = '0.5';
    process.env.VERTEX_TOP_P = '0.8';
    process.env.VERTEX_TOP_K = '10';

    t.after(cleanups);

    const config = buildConfig({
        project: 'override-project',
        generationConfig: { temperature: 0.6 }
    });

    assert.strictEqual(config.project, 'override-project');
    assert.strictEqual(config.location, 'europe-west4');
    assert.strictEqual(config.model, 'gemini-pro');
    assert.deepEqual(config.systemInstructionParts, [
        { text: 'Env part 1' },
        { text: 'Env part 2' }
    ]);

    assert.strictEqual(config.generationConfig.maxOutputTokens, 1024);
    assert.strictEqual(config.generationConfig.temperature, 0.6);
    assert.strictEqual(config.generationConfig.topP, 0.8);
    assert.strictEqual(config.generationConfig.topK, 10);
});

test('getGenerativeModel delegates to provided factory', () => {
    const factoryCalls = [];
    const requestCalls = [];
    const fakeModel = Symbol('model');
    const fakeInstance = {
        getGenerativeModel(request) {
            requestCalls.push(request);
            return fakeModel;
        }
    };

    const model = getGenerativeModel(
        { systemInstructionParts: [{ text: 'Custom instruction.' }] },
        {
            createVertexInstance(instanceConfig) {
                factoryCalls.push(instanceConfig);
                return fakeInstance;
            }
        }
    );

    assert.strictEqual(model, fakeModel);

    assert.deepEqual(factoryCalls[0], {
        project: defaultProject,
        location: defaultLocation
    });

    assert.equal(requestCalls.length, 1);
    assert.deepEqual(requestCalls[0], {
        model: defaultModel,
        safetySettings: defaultSafetySettings,
        generationConfig: defaultGenerationConfig,
        systemInstruction: {
            role: 'system',
            parts: [{ text: 'Custom instruction.' }]
        }
    });
});

test('string overrides still coerce to text parts', () => {
    const config = buildConfig({ systemInstruction: 'Legacy string instruction.' });

    assert.deepEqual(config.systemInstructionParts, [{ text: 'Legacy string instruction.' }]);
});

function rememberEnv(keys) {
    const prior = new Map(keys.map((key) => [key, process.env[key]]));

    return () => {
        for (const [key, value] of prior.entries()) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    };
}
