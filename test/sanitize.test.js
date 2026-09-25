'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { sanitizeRequest, compressContext, resolveContextLimit, SAFE_CONTEXT_TOKEN_LIMIT } = require(
  path.join(__dirname, '..', 'src', 'sanitize'),
);

describe('Long Context and Sanitization', () => {
  it('resolves correct context limits per model family', () => {
    assert.strictEqual(resolveContextLimit('gemini-3.8-flash-high'), 1000000);
    assert.strictEqual(resolveContextLimit('gemini-3.7-flash-medium'), 1000000);
    assert.strictEqual(resolveContextLimit('claude-sonnet-4-6'), 200000);
    assert.strictEqual(resolveContextLimit('claude-opus-4-6-thinking'), 200000);
    assert.strictEqual(resolveContextLimit('gpt-oss-120b-medium'), 128000);
    assert.strictEqual(resolveContextLimit('unknown-model'), SAFE_CONTEXT_TOKEN_LIMIT);
  });

  it('preserves complete tool responses up to 100,000 characters without truncation', () => {
    const largeToolContent = 'A'.repeat(50000); // 50k characters
    const messages = [
      { role: 'user', content: 'Read file' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'read_file', arguments: '{}' } }],
      },
      { role: 'tool', tool_call_id: 'call_1', content: largeToolContent },
    ];

    const result = compressContext(messages, null, 'gemini-3.8-flash-high');
    const toolMsg = result.find((m) => m.role === 'tool');
    assert.strictEqual(toolMsg.content.length, 50000);
    assert.ok(!toolMsg.content.includes('[truncated to prevent memory crash]'));
  });

  it('does not drop earlier messages when total tokens are well within safe context limit', () => {
    const messages = [];
    for (let i = 0; i < 20; i++) {
      messages.push({ role: 'user', content: `Question ${i}: tell me about code` });
      messages.push({ role: 'assistant', content: `Answer ${i}: here is explanation` });
    }

    const sanitized = sanitizeRequest({
      model: 'gemini-3.8-flash-high',
      messages,
    });

    assert.strictEqual(sanitized.messages.length, 40);
  });
});
