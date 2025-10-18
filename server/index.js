const functions = require('@google-cloud/functions-framework');

/**
 * Compute simple text analytics used by the HTTP handler.
 * @param {string} textInput raw text to be analyzed
 * @returns {{wordCount: number, characterCount: number, uniqueWordCount: number}}
 */
function analyzeTextStats(textInput) {
    const text = typeof textInput === 'string' ? textInput : '';
    const trimmedText = text.trim();
    const words = trimmedText.length ? trimmedText.split(/\s+/).filter(Boolean) : [];
    const normalizedWords = words.map(word => word.toLowerCase());

    return {
        wordCount: words.length,
        characterCount: text.length,
        uniqueWordCount: new Set(normalizedWords).size
    };
}

/**
 * Cloud Function entry point that exposes the text analyzer over HTTP.
 */
function analyzeTextHandler(req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).send({ error: 'Method not allowed' });
    }

    const bodyText = typeof req.body === 'object' && req.body !== null ? req.body.text : undefined;
    const rawText = typeof bodyText === 'string'
        ? bodyText
        : typeof req.body === 'string'
            ? req.body
            : typeof req.query?.text === 'string'
                ? req.query.text
                : '';

    const stats = analyzeTextStats(rawText);
    return res.status(200).send(stats);
}

functions.http('analyzeText', analyzeTextHandler);

module.exports = { analyzeTextStats, analyzeTextHandler };