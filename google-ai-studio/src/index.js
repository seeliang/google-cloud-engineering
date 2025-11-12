import { loadConfig } from './config.js';
import { run } from './aiStudioClient.js';

async function main() {
    const config = loadConfig();
    await run(config);
}

main().catch((error) => {
    console.error('Unexpected failure while invoking AI Studio', error);
    process.exitCode = 1;
});
