const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeTextStats, analyzeTextHandler } = require('../index');

function createMockRes() {
    const headers = {};
    return {
        headers,
        statusCode: 200,
        body: undefined,
        set(name, value) {
            headers[name] = value;
            return this;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(payload) {
            this.body = payload;
            return payload;
        }
    };
}

test('analyzeTextStats normalizes and counts words', () => {
    const stats = analyzeTextStats('Hello hello world');
    assert.deepEqual(stats, {
        wordCount: 3,
        characterCount: 17,
        uniqueWordCount: 2
    });
});

test('analyzeTextHandler responds with stats for POST body text', () => {
    const req = { method: 'POST', body: { text: 'one two two' }, query: {} };
    const res = createMockRes();

    const payload = analyzeTextHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
    assert.deepEqual(payload, {
        wordCount: 3,
        characterCount: 11,
        uniqueWordCount: 2
    });
});

test('analyzeTextHandler supports GET text via query parameter', () => {
    const req = { method: 'GET', body: {}, query: { text: 'hi there' } };
    const res = createMockRes();

    const payload = analyzeTextHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(payload, {
        wordCount: 2,
        characterCount: 8,
        uniqueWordCount: 2
    });
});

test('analyzeTextHandler rejects unsupported methods', () => {
    const req = { method: 'PUT', body: {}, query: {} };
    const res = createMockRes();

    const payload = analyzeTextHandler(req, res);

    assert.equal(res.statusCode, 405);
    assert.deepEqual(payload, { error: 'Method not allowed' });
});

test('analyzeTextHandler handles CORS pre-flight requests', () => {
    const req = { method: 'OPTIONS', body: {}, query: {} };
    const res = createMockRes();

    const payload = analyzeTextHandler(req, res);

    assert.equal(res.statusCode, 204);
    assert.equal(payload, undefined);
});
