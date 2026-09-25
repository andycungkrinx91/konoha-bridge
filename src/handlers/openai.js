'use strict';

const { randomUUID } = require('crypto');
const {
  log,
  verboseLog,
  sendJson,
  setupStreamResponse,
  readBody,
  buildStreamChunk,
  buildCompletion,
  parseRetryAfter,
  extractProviderError,
} = require('../utils');
const { extractText, extractAllImages } = require('../images');
const { resolveModel } = require('../models');
const { resolveWorkspace } = require('../workspace');
const { callRawInference } = require('../sidecar/raw');
const { sanitizeRequest } = require('../sanitize');

// Map numeric model enum values → GetModelResponse string enum
const VALUE_TO_MODEL_ENUM = {
  1018: 'MODEL_PLACEHOLDER_M18', // Flash
  1037: 'MODEL_PLACEHOLDER_M16', // Pro High
  1036: 'MODEL_PLACEHOLDER_M36', // Pro Low
  1035: 'MODEL_PLACEHOLDER_M35', // Sonnet
  1026: 'MODEL_PLACEHOLDER_M26', // Opus
  342: 'MODEL_OPENAI_GPT_OSS_120B_MEDIUM', // GPT-OSS 120B
  1046: 'MODEL_PLACEHOLDER_M18', // Gemini 3.6 Flash Medium
  1047: 'MODEL_PLACEHOLDER_M18', // Gemini 3.6 Flash High
  1048: 'MODEL_PLACEHOLDER_M18', // Gemini 3.6 Flash Low
  1049: 'MODEL_PLACEHOLDER_M18', // Gemini 3.7 Flash Medium
  1050: 'MODEL_PLACEHOLDER_M18', // Gemini 3.7 Flash High
  1051: 'MODEL_PLACEHOLDER_M18', // Gemini 3.7 Flash Low
  1052: 'MODEL_PLACEHOLDER_M18', // Gemini 3.8 Flash Medium
  1053: 'MODEL_PLACEHOLDER_M18', // Gemini 3.8 Flash High
  1054: 'MODEL_PLACEHOLDER_M18', // Gemini 3.8 Flash Low
};

async function handleChatCompletions(ctx, req, res) {
  const body = await readBody(req);
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return sendJson(res, 400, { error: { message: 'Invalid JSON', type: 'invalid_request' } });
  }

  // Debug: log incoming request payload (verbose only)
  // The full body is strictly dumped to the file logs to prevent VSCode UI lag
  verboseLog(ctx, `📥 Request body (${body.length} bytes): ${body.substring(0, 500)}...`, body);

  payload = sanitizeRequest(payload);
  const isStream = payload.stream === true;
  const messages = payload.messages || [];
  const completionId = `chatcmpl-${randomUUID()}`;

  // Safeguard: detect [object Object] serialization corruption
  const userTexts = messages.filter((m) => m.role === 'user').map((m) => extractText(m.content));
  const allCorrupted = userTexts.length > 0 && userTexts.every((t) => t.startsWith('[object Object]'));
  if (allCorrupted) {
    log(ctx, `⚠️ [object Object] DETECTED — upstream caller is not serializing messages properly!`, true);
    log(ctx, `⚠️ Raw messages: ${JSON.stringify(messages).substring(0, 300)}`);
    return sendJson(res, 400, {
      error: {
        message:
          'Messages contain "[object Object]" — the caller is not serializing message objects to JSON properly. Check that content is a string or valid content-parts array.',
        type: 'invalid_request',
        raw_messages: messages.slice(0, 3),
      },
    });
  }

  // ── Rate limiting: only throttle if explicitly configured ──
  const now = Date.now();
  const timeSinceLastResponse = now - ctx.lastResponseTimestamp;
  if (ctx.MIN_REQUEST_INTERVAL_MS > 0 && timeSinceLastResponse < ctx.MIN_REQUEST_INTERVAL_MS) {
    log(
      ctx,
      `🛑 Rate limited — only ${timeSinceLastResponse}ms since last response (min ${ctx.MIN_REQUEST_INTERVAL_MS}ms)`,
    );
    return sendJson(res, 429, {
      error: {
        message: `Rate limited: please wait ${Math.ceil((ctx.MIN_REQUEST_INTERVAL_MS - timeSinceLastResponse) / 1000)}s before sending another request.`,
        type: 'rate_limit',
      },
    });
  }

  // ── Duplicate detection: only block identical concurrent in-flight requests ──
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : { role: 'none', content: '' };
  const lastMsgText = `${lastMsg.role}:${extractText(lastMsg.content)}`;
  const msgHash = lastMsgText.substring(0, 500);
  if (
    ctx.DEDUP_WINDOW_MS > 0 &&
    ctx.chatRequestsInFlight > 0 &&
    msgHash === ctx.lastUserMessageHash &&
    now - ctx.lastUserMessageTimestamp < ctx.DEDUP_WINDOW_MS
  ) {
    log(ctx, `🛑 Concurrent duplicate message rejected within ${ctx.DEDUP_WINDOW_MS / 1000}s`);
    return sendJson(res, 429, {
      error: { message: 'Duplicate concurrent request detected within dedup window.', type: 'rate_limit' },
    });
  }
  ctx.lastUserMessageHash = msgHash;
  ctx.lastUserMessageTimestamp = now;

  // Resolve model from request
  const resolved = resolveModel(payload.model);
  log(ctx, `📡 Model: ${resolved.key} (enum=${resolved.value})`);

  // Resolve workspace
  const { workspaceDir, workspaceUri } = resolveWorkspace(ctx, messages, payload, req);

  // ── Concurrency guard: limit parallel requests ──
  if (ctx.chatRequestsInFlight >= ctx.MAX_CONCURRENT_REQUESTS) {
    log(
      ctx,
      `🛑 Request rejected — ${ctx.chatRequestsInFlight} requests already in flight (max ${ctx.MAX_CONCURRENT_REQUESTS})`,
    );
    const busyMsg = '[Too many concurrent requests. Please wait and try again.]';
    if (isStream) {
      setupStreamResponse(res);
      res.write(`data: ${JSON.stringify({ error: { message: busyMsg, type: 'rate_limit' } })}\n\n`);
      res.end();
    } else {
      sendJson(res, 429, { error: { message: busyMsg, type: 'rate_limit' } });
    }
    return;
  }

  ctx.chatRequestsInFlight++;
  log(ctx, `📡 Requests in flight: ${ctx.chatRequestsInFlight}`);

  let keepAliveTimer = null;
  // Shared mutable flag — must be accessed via closure, never passed by value.
  const streamState = { headersSent: false };

  const initiateStream = () => {
    if (isStream && !streamState.headersSent) {
      setupStreamResponse(res);
      streamState.headersSent = true;
      // Send initial role chunk immediately so client gets TTFB < 10ms
      const roleChunk = buildStreamChunk(completionId, resolved.key, '');
      res.write(`data: ${JSON.stringify(roleChunk)}\n\n`);
    }
  };

  if (isStream) {
    initiateStream(); // Immediate stream startup for zero TTFB latency

    keepAliveTimer = setInterval(() => {
      // Send a valid empty OpenAI delta instead of a raw SSE comment.
      // Yielding an actual empty delta successfully resets the client's internal read timer.
      const beat = buildStreamChunk(completionId, resolved.key, null);
      res.write(`data: ${JSON.stringify(beat)}\n\n`);
    }, 2500);
  }

  // aislop-ignore-next-line code-quality/duplicate-block (structurally similar error handling wrapper)
  try {
    await _handleChatCompletionsInner(
      ctx,
      res,
      isStream,
      initiateStream,
      streamState,
      messages,
      completionId,
      resolved,
      workspaceDir,
      workspaceUri,
      payload,
    );
  } finally {
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    ctx.chatRequestsInFlight--;
    ctx.lastResponseTimestamp = Date.now();
  }
}

async function _handleChatCompletionsInner(
  ctx,
  res,
  isStream,
  initiateStream,
  streamState,
  messages,
  completionId,
  resolved,
  workspaceDir,
  workspaceUri,
  payload,
) {
  // Extract images from OpenAI-format messages (base64 data URLs, remote URLs, file URIs)
  let images = [];
  try {
    images = await extractAllImages(ctx, messages);
    if (images.length > 0) {
      log(ctx, `🖼️ Extracted ${images.length} image(s) from messages`);
    }
  } catch (e) {
    log(ctx, `⚠️ Image extraction failed: ${e.message}`);
  }

  const tools = payload.tools && payload.tools.length > 0 ? payload.tools : null;
  let modelEnum = VALUE_TO_MODEL_ENUM[resolved?.value];
  if (!modelEnum) {
    const key = String(resolved?.key || payload.model || '').toLowerCase();
    if (key.includes('opus')) {
      modelEnum = 'MODEL_PLACEHOLDER_M26';
    } else if (key.includes('sonnet') || key.includes('haiku') || key.includes('claude')) {
      modelEnum = 'MODEL_PLACEHOLDER_M35';
    } else if (key.includes('pro')) {
      modelEnum = 'MODEL_PLACEHOLDER_M16';
    } else if (key.includes('gpt-oss') || key.includes('oss-120b')) {
      modelEnum = 'MODEL_OPENAI_GPT_OSS_120B_MEDIUM';
    } else {
      modelEnum = 'MODEL_PLACEHOLDER_M18';
    }
    log(
      ctx,
      `⚠️ Unmapped model value '${resolved?.value}' for '${resolved?.key || payload.model}' — falling back to ${modelEnum}`,
    );
  }

  try {
    log(ctx, `🧠 Trying raw inference (${modelEnum})...`);
    const raw = await callRawInference(ctx, messages, modelEnum, tools, images);
    if (raw && (raw.content || raw.toolCalls)) {
      const text = raw.content || '';
      log(ctx, `✅ Raw inference succeeded (${text.length} chars)`);
      if (isStream) {
        initiateStream();
        if (raw.toolCalls) {
          // Stream tool calls in OpenAI format, always supply at least an empty string to force 'role: assistant'
          const chunk = buildStreamChunk(completionId, resolved.key, text || '', null);
          chunk.choices[0].delta.tool_calls = raw.toolCalls;
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (text) {
          const CHUNK_SIZE = 64;
          for (let i = 0; i < text.length; i += CHUNK_SIZE) {
            const chunk = buildStreamChunk(completionId, resolved.key, text.slice(i, i + CHUNK_SIZE));
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        }
        const finishReason = raw.toolCalls ? 'tool_calls' : 'stop';
        res.write(`data: ${JSON.stringify(buildStreamChunk(completionId, resolved.key, null, finishReason))}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        const completion = buildCompletion(completionId, resolved.key, text);
        if (raw.toolCalls) {
          completion.choices[0].message.tool_calls = raw.toolCalls;
          completion.choices[0].finish_reason = 'tool_calls';
        }
        sendJson(res, 200, completion);
      }
      return;
    }
    throw new Error('Raw inference returned empty content or no tool calls');
  } catch (err) {
    log(ctx, `⚠️ Raw inference failed: ${err.message}`);

    // Enforce 429 for rate limit / capacity errors, otherwise 502 for general upstream/H2 crashes
    const isRateLimit =
      err.message.includes('capacity') ||
      err.message.includes('429') ||
      err.message.includes('RESOURCE_EXHAUSTED') ||
      err.message.toLowerCase().includes('sse read timed out') ||
      err.message.includes('H2 connect') ||
      err.message.includes('H2 timeout') ||
      err.message.includes('Sidecar not discovered') ||
      err.message.includes('No reachable LS port') ||
      err.message.includes('empty content') ||
      err.message.includes('HTTP 500') ||
      err.message.includes('INTERNAL') ||
      err.message.includes('ECONNRESET') ||
      err.message.includes('socket hang up');
    const status = isRateLimit ? 429 : 502;
    const errType = isRateLimit ? 'rate_limit' : 'server_error';

    const retryAfterSecs = parseRetryAfter(err.message);

    log(
      ctx,
      `🛑 [${isRateLimit ? 'rate_limit→429' : 'server_error→502'}] returning ${status} (Retry-After: ${retryAfterSecs}s): ${err.message.substring(0, 120)}`,
    );

    const cleanMessage = extractProviderError(err.message);
    const errPayload = {
      error: {
        message: `Upstream model provider error: ${cleanMessage}`,
        type: errType,
      },
    };

    // If we haven't sent stream headers yet, we can send a true HTTP error.
    // The client SDK will correctly read the HTTP status code and Retry-After header.
    if (isStream && streamState.headersSent) {
      // Stream already committed to HTTP 200 — inject error as SSE event
      res.write(`data: ${JSON.stringify({ error: errPayload.error })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else if (!res.headersSent) {
      // Stream NOT yet committed — return a proper HTTP 429/502 status code
      res.setHeader('Retry-After', String(retryAfterSecs));
      sendJson(res, status, errPayload);
    }
  }
}

module.exports = { handleChatCompletions };
