'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { buildStreamChunk, setupStreamResponse } = require(path.join(__dirname, '..', 'src', 'utils'));
const { closeAllH2Sessions } = require(path.join(__dirname, '..', 'src', 'sidecar', 'rpc'));

describe('Stream handling and chunk formatting', () => {
  it('buildStreamChunk builds proper SSE delta chunks', () => {
    const chunk = buildStreamChunk('chatcmpl-123', 'gemini-3.8-flash-high', 'Hello world');
    assert.strictEqual(chunk.id, 'chatcmpl-123');
    assert.strictEqual(chunk.model, 'gemini-3.8-flash-high');
    assert.strictEqual(chunk.choices[0].delta.content, 'Hello world');
    assert.strictEqual(chunk.choices[0].delta.role, 'assistant');
    assert.strictEqual(chunk.choices[0].finish_reason, null);
  });

  it('buildStreamChunk builds stop chunk correctly', () => {
    const stopChunk = buildStreamChunk('chatcmpl-123', 'gemini-3.8-flash-high', null, 'stop');
    assert.strictEqual(stopChunk.choices[0].finish_reason, 'stop');
    assert.deepStrictEqual(stopChunk.choices[0].delta, {});
  });

  it('setupStreamResponse configures headers with no delay', () => {
    const headers = {};
    let writtenCode = null;
    let flushed = false;
    let noDelaySet = false;

    const mockRes = {
      setHeader(k, v) {
        headers[k] = v;
      },
      writeHead(code) {
        writtenCode = code;
      },
      flushHeaders() {
        flushed = true;
      },
      socket: {
        setNoDelay(val) {
          noDelaySet = val;
        },
      },
    };

    setupStreamResponse(mockRes);
    assert.strictEqual(writtenCode, 200);
    assert.strictEqual(headers['Content-Type'], 'text/event-stream');
    assert.strictEqual(headers['Cache-Control'], 'no-cache');
    assert.strictEqual(headers['Connection'], 'keep-alive');
    assert.strictEqual(flushed, true);
    assert.strictEqual(noDelaySet, true);
  });

  it('closeAllH2Sessions cleans up pooled connections cleanly', () => {
    // Should run without error even if pool is empty
    assert.doesNotThrow(() => {
      closeAllH2Sessions();
    });
  });
});
