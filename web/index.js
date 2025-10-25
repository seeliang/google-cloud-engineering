const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
const productionFunctionUrl = 'https://us-central1-cloud-engineer-certify.cloudfunctions.net/analyzeText';
const defaultFunctionUrl = process.env.NODE_ENV === 'production' ? productionFunctionUrl : 'http://localhost:8080';
const functionUrl = process.env.ANALYZE_FUNCTION_URL || defaultFunctionUrl;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderPage({ text = '', stats, error }) {
    const escapedText = escapeHtml(text);
    const messageHtml = error ? `<p class="message error">${escapeHtml(error)}</p>` : '';
    const statsHtml = stats
        ? `<section class="results">
  <h2>Analysis Result</h2>
  <dl>
    <div><dt>Word Count</dt><dd>${stats.wordCount}</dd></div>
    <div><dt>Character Count</dt><dd>${stats.characterCount}</dd></div>
    <div><dt>Unique Word Count</dt><dd>${stats.uniqueWordCount}</dd></div>
  </dl>
</section>`
        : '';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Text Analyzer Proxy</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; max-width: 720px; }
    form { display: grid; gap: 1rem; }
    textarea { width: 100%; min-height: 10rem; padding: 0.75rem; font-size: 1rem; }
    button { width: 10rem; padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer; }
    .message { padding: 0.75rem; border-radius: 0.25rem; }
    .error { background: #ffd6d6; border: 1px solid #cc4b4b; }
    .results { margin-top: 2rem; background: #f5f5f5; padding: 1rem; border-radius: 0.25rem; }
    .results dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.5rem 1rem; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; }
  </style>
</head>
<body>
  <h1>Text Analyzer</h1>
  <p>Submit text below to analyze it with the Cloud Function at <code>${escapeHtml(functionUrl)}</code>.</p>
  ${messageHtml}
  <form action="/submit" method="post">
    <label for="text">Text to analyze</label>
    <textarea id="text" name="text" required>${escapedText}</textarea>
    <button type="submit">Analyze</button>
  </form>
  ${statsHtml}
</body>
</html>`;
}

async function forwardText(text) {
    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Analyzer responded with ${response.status}: ${details}`);
    }

    const clone = response.clone();
    try {
        const payload = await response.json();
        if (typeof payload !== 'object' || payload === null) {
            throw new Error('Analyzer response did not include JSON.');
        }
        return payload;
    } catch (parseError) {
        const fallback = await clone.text();
        throw new Error(`Analyzer response was not JSON: ${fallback}`);
    }
}

app.get('/', (req, res) => {
    res.type('html').send(renderPage({ text: '' }));
});

app.post('/submit', async (req, res) => {
    const rawText = typeof req.body.text === 'string' ? req.body.text : '';
    if (!rawText.trim()) {
        return res.status(400).type('html').send(renderPage({ text: rawText, error: 'Text is required.' }));
    }

    try {
        const stats = await forwardText(rawText);
        return res.type('html').send(renderPage({ text: rawText, stats }));
    } catch (error) {
        return res.status(502).type('html').send(renderPage({ text: rawText, error: error.message }));
    }
});

app.post('/api/analyze', async (req, res) => {
    const rawText = typeof req.body.text === 'string' ? req.body.text : '';
    if (!rawText.trim()) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    try {
        const stats = await forwardText(rawText);
        return res.json({ text: rawText, stats });
    } catch (error) {
        return res.status(502).json({ error: 'Failed to reach analyzer.', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Express proxy listening on http://localhost:${port}`);
    console.log(`Forwarding requests to ${functionUrl}`);
});
