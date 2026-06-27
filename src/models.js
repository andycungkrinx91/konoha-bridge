'use strict';

// ─────────────────────────────────────────────
// Model Mapping: string ID → sidecar enum value
// ─────────────────────────────────────────────

const MODEL_MAP = {
  // Main Antigravity models
  'gemini-3.5-flash-medium': {
    value: 1018,
    name: 'Gemini 3.5 Flash (Medium) Fast',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  'gemini-3.5-flash-high': {
    value: 1018,
    name: 'Gemini 3.5 Flash (High) Fast',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  'gemini-3.5-flash-low': {
    value: 1018,
    name: 'Gemini 3.5 Flash (Low) Fast',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  'gemini-3.1-pro-high': {
    value: 1037,
    name: 'Gemini 3.1 Pro (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65535,
  },
  'gemini-3.1-pro-low': {
    value: 1036,
    name: 'Gemini 3.1 Pro (Low)',
    owned_by: 'google',
    context: 1048576,
    output: 65535,
  },
  'claude-sonnet-4-6': {
    value: 1035,
    name: 'Claude Sonnet 4.6 (Thinking)',
    owned_by: 'anthropic',
    context: 200000,
    output: 64000,
  },
  'claude-opus-4-6-thinking': {
    value: 1026,
    name: 'Claude Opus 4.6 (Thinking)',
    owned_by: 'anthropic',
    context: 200000,
    output: 64000,
  },
  'gpt-oss-120b': {
    value: 342,
    name: 'GPT-OSS 120B (Medium)',
    owned_by: 'openai',
    context: 128000,
    output: 16384,
  },
  // Aliases for convenience
  antigravity: {
    value: 1043,
    name: 'Antigravity (Default)',
    owned_by: 'antigravity',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'gpt-oss-120b-medium': {
    value: 342,
    name: 'GPT-OSS 120B (Medium)',
    owned_by: 'openai',
    context: 128000,
    output: 16384,
    hidden: true,
  },
  // Backward compat: antigravity-* aliases
  'antigravity-claude-sonnet-4-6': {
    value: 1035,
    name: 'Claude Sonnet 4.6 (Thinking)',
    owned_by: 'anthropic',
    context: 200000,
    output: 64000,
    hidden: true,
  },
  'antigravity-claude-opus-4-6-thinking': {
    value: 1026,
    name: 'Claude Opus 4.6 (Thinking)',
    owned_by: 'anthropic',
    context: 200000,
    output: 64000,
    hidden: true,
  },
  'antigravity-gpt-oss-120b': {
    value: 342,
    name: 'GPT-OSS 120B (Medium)',
    owned_by: 'openai',
    context: 128000,
    output: 16384,
    hidden: true,
  },
  'antigravity-gemini-3.5-flash-medium': {
    value: 1018,
    name: 'Gemini 3.5 Flash (Medium) Fast',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.5-flash-high': {
    value: 1018,
    name: 'Gemini 3.5 Flash (High) Fast',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.5-flash-low': {
    value: 1018,
    name: 'Gemini 3.5 Flash (Low) Fast',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.1-pro-high': {
    value: 1037,
    name: 'Gemini 3.1 Pro (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65535,
    hidden: true,
  },
  'antigravity-gemini-3.1-pro-low': {
    value: 1036,
    name: 'Gemini 3.1 Pro (Low)',
    owned_by: 'google',
    context: 1048576,
    output: 65535,
    hidden: true,
  },
};

const DEFAULT_MODEL_KEY = 'gemini-3.5-flash-medium';

function resolveModel(requestedModel) {
  if (!requestedModel || requestedModel === 'antigravity') {
    return { key: DEFAULT_MODEL_KEY, ...MODEL_MAP[DEFAULT_MODEL_KEY] };
  }
  if (MODEL_MAP[requestedModel]) return { key: requestedModel, ...MODEL_MAP[requestedModel] };
  // Try partial match (e.g. "claude-sonnet" matches "claude-sonnet-4.6")
  const lower = requestedModel.toLowerCase();
  for (const [k, v] of Object.entries(MODEL_MAP)) {
    if (k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())) {
      return { key: k, ...v };
    }
  }
  // Default fallback
  return { key: DEFAULT_MODEL_KEY, ...MODEL_MAP[DEFAULT_MODEL_KEY] };
}

module.exports = {
  MODEL_MAP,
  DEFAULT_MODEL_KEY,
  resolveModel,
};
