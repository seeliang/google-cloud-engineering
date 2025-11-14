const { VertexAI } = require('@google-cloud/vertexai');
const {
    DEFAULT_PROJECT,
    DEFAULT_LOCATION,
    DEFAULT_MODEL,
    DEFAULT_GENERATION_CONFIG,
    DEFAULT_SAFETY_SETTINGS,
    DEFAULT_SYSTEM_INSTRUCTION_PARTS,
    buildConfig
} = require('./config');

function getGenerativeModel(overrides = {}, options = {}) {
    const config = buildConfig(overrides);
    const createVertexInstance = options.createVertexInstance || defaultCreateVertexInstance;
    const vertexInstance = createVertexInstance({ project: config.project, location: config.location }, config);

    assertVertexInstance(vertexInstance);

    return vertexInstance.getGenerativeModel({
        model: config.model,
        safetySettings: config.safetySettings,
        generationConfig: config.generationConfig,
        systemInstruction: buildSystemInstruction(config.systemInstructionParts)
    });
}

function defaultCreateVertexInstance({ project, location }) {
    return new VertexAI({ project, location });
}

function buildSystemInstruction(parts) {
    return {
        role: 'system',
        parts: parts.map((part) => ({ ...part }))
    };
}

function assertVertexInstance(instance) {
    if (!instance || typeof instance.getGenerativeModel !== 'function') {
        throw new TypeError('Expected createVertexInstance to return a VertexAI client with getGenerativeModel().');
    }
}

module.exports = {
    getGenerativeModel,
    buildConfig,
    defaultProject: DEFAULT_PROJECT,
    defaultLocation: DEFAULT_LOCATION,
    defaultModel: DEFAULT_MODEL,
    defaultGenerationConfig: DEFAULT_GENERATION_CONFIG,
    defaultSafetySettings: DEFAULT_SAFETY_SETTINGS,
    defaultSystemInstructionParts: DEFAULT_SYSTEM_INSTRUCTION_PARTS
};
