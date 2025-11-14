#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const process = require('node:process');

const { getGenerativeModel, buildConfig } = require('../src');

async function main() {
    const [, , filePath] = process.argv;

    if (!filePath) {
        console.error('Usage: node scripts/runFromConfig.js <config-json-path>');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), filePath);

    let payload;
    try {
        const raw = await fs.readFile(absolutePath, 'utf8');
        payload = JSON.parse(raw);
    } catch (error) {
        console.error(`Failed to load JSON file at ${absolutePath}: ${error.message}`);
        process.exit(1);
    }

    const overrides = { ...(payload.overrides ?? {}) };
    if (!overrides.model && typeof payload.model === 'string' && payload.model.trim()) {
        overrides.model = payload.model.trim();
    }
    const request = payload.request;

    const config = buildConfig(overrides);
    const report = {
        inputFile: absolutePath,
        generatedAt: new Date().toISOString(),
        config: {
            project: config.project,
            location: config.location,
            model: config.model,
            generationConfig: config.generationConfig,
            systemInstructionParts: config.systemInstructionParts,
            safetySettings: config.safetySettings
        },
        overrides,
        request: request ?? null,
        response: null,
        error: null
    };

    console.log('Resolved configuration:');
    console.log(JSON.stringify(report.config, null, 2));

    const writeReport = buildWriter(absolutePath);

    if (!request) {
        console.log('No request payload supplied; skipping model invocation.');
        const outputPath = await writeReport(report, 'no-request');
        console.log(`Report written to ${outputPath}`);
        return;
    }

    const model = getGenerativeModel(overrides);

    try {
        const response = await model.generateContent(request);
        report.response = response;
        console.log('Model response:');
        console.log(JSON.stringify(response, null, 2));
        const outputPath = await writeReport(report, 'success');
        console.log(`Report written to ${outputPath}`);
    } catch (error) {
        report.error = {
            name: error.name,
            message: error.message
        };
        console.error(`Model invocation failed: ${error.message}`);
        const outputPath = await writeReport(report, 'error');
        console.log(`Failure report written to ${outputPath}`);
        process.exitCode = 1;
    }
}

function buildWriter(sourcePath) {
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const resultsDir = path.resolve(__dirname, '..', 'results');

    return async (report, label) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${baseName}-${label}-${timestamp}.json`;
        const targetPath = path.join(resultsDir, fileName);

        await fs.mkdir(resultsDir, { recursive: true });
        await fs.writeFile(targetPath, JSON.stringify(report, null, 2));

        return targetPath;
    };
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
