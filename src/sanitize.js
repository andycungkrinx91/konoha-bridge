'use strict';

// Removed unused extractText

// Rough estimation: 4 characters = 1 token
const CHARS_PER_TOKEN = 3.5;

function estimateTokens(obj) {
  if (!obj) return 0;
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return Math.ceil(str.length / CHARS_PER_TOKEN);
}

// Support massive context windows (Gemini 1M+, Claude 200k)
const SAFE_CONTEXT_TOKEN_LIMIT = 1000000;
const COMPRESSION_THRESHOLD = 0.95; // Only compress if we exceed 95% of the limit

function resolveContextLimit(model) {
  if (!model || typeof model !== 'string') return SAFE_CONTEXT_TOKEN_LIMIT;
  const m = model.toLowerCase();
  if (m.includes('claude')) return 200000;
  if (m.includes('gpt-oss') || m.includes('gpt-4') || m.includes('120b')) return 128000;
  if (m.includes('gemini')) return 1000000;
  return SAFE_CONTEXT_TOKEN_LIMIT;
}

/**
 * Normalizes tool names and strips empty ones
 */
function sanitizeTools(tools) {
  if (!Array.isArray(tools)) return tools;
  return tools.filter((tool) => {
    // Preserve standard empty-name tools (like web_search if they only use 'type')
    const type = tool.type || '';
    if (type && type !== 'function' && !tool.function && tool.name === undefined) {
      return true;
    }
    const fn = tool.function || {};
    const name = fn.name || tool.name;
    return name && String(name).trim().length > 0;
  });
}

/**
 * Strips empty name fields from messages
 */
function sanitizeMessagesNames(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages.map((msg) => {
    if (msg.name === '') {
      const { name: _name, ...rest } = msg;
      return rest;
    }
    return msg;
  });
}

/**
 * Fix missing tool responses.
 * If an assistant message has tool_calls, the immediately following message MUST contain the results.
 * If it doesn't, we inject synthetic empty results.
 */
function fixMissingToolResponses(messages) {
  if (!Array.isArray(messages)) return messages;
  const newMessages = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const nextMsg = messages[i + 1];

    newMessages.push(msg);

    // Look for tool calls in the current message
    if (msg.role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      const toolCallIds = msg.tool_calls.map((tc) => tc.id).filter(Boolean);

      if (toolCallIds.length > 0) {
        // Does the next message contain the results?
        // In OpenAI format, it should be role='tool' and have tool_call_id
        let nextHasResults = false;
        if (nextMsg && nextMsg.role === 'tool' && toolCallIds.includes(nextMsg.tool_call_id)) {
          nextHasResults = true;
        }

        if (!nextHasResults) {
          // Inject empty tool responses
          for (const id of toolCallIds) {
            newMessages.push({
              role: 'tool',
              tool_call_id: id,
              content: '[No observation returned]',
            });
          }
        }
      }
    }
  }
  return newMessages;
}

/**
 * Compress context by trimming oversized tool results and dropping older messages
 * only when approaching the model's actual context boundary.
 */
function compressContext(messages, tools, model = null) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;

  const limit = resolveContextLimit(model);
  const reservedTokens = tools ? estimateTokens(tools) : 0;
  const threshold = Math.max(10000, Math.floor((limit - reservedTokens) * COMPRESSION_THRESHOLD));

  let currentTokens = estimateTokens(messages);

  // If we are under the threshold, do nothing - preserve full fidelity
  if (currentTokens <= threshold) {
    return messages;
  }

  let compressed = [...messages];

  // Layer 1: Trim exceptionally long tool responses (> 100k chars / ~25k tokens)
  compressed = compressed.map((msg) => {
    if (msg.role === 'tool' && typeof msg.content === 'string' && msg.content.length > 100000) {
      return {
        ...msg,
        content: msg.content.substring(0, 100000) + '\n... [truncated to prevent memory crash]',
      };
    }
    return msg;
  });

  currentTokens = estimateTokens(compressed);
  if (currentTokens <= threshold) return compressed;

  // Layer 2: Drop older messages
  // Keep system messages and the last N message pairs
  const system = compressed.filter((m) => m.role === 'system' || m.role === 'developer');
  const nonSystem = compressed.filter((m) => m.role !== 'system' && m.role !== 'developer');

  let keep = nonSystem.length;
  while (keep > 10) {
    const candidate = [...system, ...nonSystem.slice(-keep)];
    const tokens = estimateTokens(candidate);
    if (tokens <= threshold) break;
    keep = Math.max(10, Math.floor(keep * 0.7)); // Drop 30% each iteration
  }

  const finalMessages = [...system, ...nonSystem.slice(-keep)];

  // Add summary of dropped messages
  if (keep < nonSystem.length) {
    const dropped = nonSystem.length - keep;
    finalMessages.splice(system.length, 0, {
      role: 'system',
      content: `[Context compressed: ${dropped} earlier messages removed to fit within safe memory limits]`,
    });
  }

  return finalMessages;
}

/**
 * Main sanitization pipeline
 */
function sanitizeRequest(payload) {
  if (!payload) return payload;

  const newPayload = { ...payload };

  // 1. Token field normalization
  if (newPayload.max_output_tokens !== undefined && newPayload.max_tokens === undefined) {
    newPayload.max_tokens = newPayload.max_output_tokens;
  }

  // 2. Sanitize tools
  if (newPayload.tools) {
    newPayload.tools = sanitizeTools(newPayload.tools);
  }

  // 3. Sanitize and compress messages (model-aware)
  if (newPayload.messages) {
    let messages = newPayload.messages;
    messages = sanitizeMessagesNames(messages);
    messages = fixMissingToolResponses(messages);
    messages = compressContext(messages, newPayload.tools, newPayload.model);
    newPayload.messages = messages;
  }

  return newPayload;
}

module.exports = {
  sanitizeRequest,
  sanitizeTools,
  sanitizeMessagesNames,
  fixMissingToolResponses,
  compressContext,
  resolveContextLimit,
  SAFE_CONTEXT_TOKEN_LIMIT,
};
