'use strict';

const MODEL_MAP = {
  // Main Antigravity models
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.8-flash-high': {
    value: 1053,
    name: 'Gemini 3.8 Flash (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.8-flash-medium': {
    value: 1052,
    name: 'Gemini 3.8 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.8-flash-low': {
    value: 1054,
    name: 'Gemini 3.8 Flash (Low)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.7-flash-high': {
    value: 1050,
    name: 'Gemini 3.7 Flash (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.7-flash-medium': {
    value: 1049,
    name: 'Gemini 3.7 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.7-flash-low': {
    value: 1051,
    name: 'Gemini 3.7 Flash (Low)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.6-flash-high': {
    value: 1047,
    name: 'Gemini 3.6 Flash (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.6-flash-medium': {
    value: 1046,
    name: 'Gemini 3.6 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'gemini-3.6-flash-low': {
    value: 1048,
    name: 'Gemini 3.6 Flash (Low)',
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
  'gpt-oss-120b-medium': {
    value: 342,
    name: 'GPT-OSS 120B (Medium)',
    owned_by: 'openai',
    context: 128000,
    output: 16384,
  },
  // Aliases for convenience
  'gpt-oss-120b': {
    value: 342,
    name: 'GPT-OSS 120B (Medium)',
    owned_by: 'openai',
    context: 128000,
    output: 16384,
    hidden: true,
  },
  antigravity: {
    value: 1046,
    name: 'Antigravity (Default)',
    owned_by: 'antigravity',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  // Backward compat: antigravity-* aliases
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'antigravity-gemini-3.8-flash-high': {
    value: 1053,
    name: 'Gemini 3.8 Flash (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'antigravity-gemini-3.8-flash-medium': {
    value: 1052,
    name: 'Gemini 3.8 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'antigravity-gemini-3.8-flash-low': {
    value: 1054,
    name: 'Gemini 3.8 Flash (Low)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
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
  'antigravity-gpt-oss-120b-medium': {
    value: 342,
    name: 'GPT-OSS 120B (Medium)',
    owned_by: 'openai',
    context: 128000,
    output: 16384,
    hidden: true,
  },
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  // aislop-ignore-next-line code-quality/duplicate-block (declarative model map entry)
  'antigravity-gemini-3.7-flash-medium': {
    value: 1049,
    name: 'Gemini 3.7 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.7-flash-high': {
    value: 1050,
    name: 'Gemini 3.7 Flash (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.7-flash-low': {
    value: 1051,
    name: 'Gemini 3.7 Flash (Low)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.6-flash-medium': {
    value: 1046,
    name: 'Gemini 3.6 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.6-flash-high': {
    value: 1047,
    name: 'Gemini 3.6 Flash (High)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'antigravity-gemini-3.6-flash-low': {
    value: 1048,
    name: 'Gemini 3.6 Flash (Low)',
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
  // Convenience aliases
  'gemini-3.8-flash': {
    value: 1052,
    name: 'Gemini 3.8 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'gemini-3.7-flash': {
    value: 1049,
    name: 'Gemini 3.7 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'gemini-3.6-flash': {
    value: 1046,
    name: 'Gemini 3.6 Flash (Medium)',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  'gemini-flash': {
    value: 1018,
    name: 'Gemini Flash',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
  flash: {
    value: 1018,
    name: 'Gemini Flash',
    owned_by: 'google',
    context: 1048576,
    output: 65536,
    hidden: true,
  },
};

const DEFAULT_MODEL_KEY = 'gemini-3.6-flash-medium';

function resolveModel(requestedModel) {
  if (!requestedModel || requestedModel === 'antigravity') {
    return { key: DEFAULT_MODEL_KEY, ...MODEL_MAP[DEFAULT_MODEL_KEY] };
  }
  if (Object.prototype.hasOwnProperty.call(MODEL_MAP, requestedModel)) {
    return { key: requestedModel, ...MODEL_MAP[requestedModel] };
  }

  const lower = String(requestedModel).toLowerCase();

  // Direct substring or inclusion match on keys
  for (const [k, v] of Object.entries(MODEL_MAP)) {
    if (k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())) {
      return { key: k, ...v };
    }
  }

  // Smart family heuristic matching for standard external model names
  if (lower.includes('opus')) {
    return { key: 'claude-opus-4-6-thinking', ...MODEL_MAP['claude-opus-4-6-thinking'] };
  }
  if (lower.includes('sonnet') || lower.includes('haiku') || lower.includes('claude')) {
    return { key: 'claude-sonnet-4-6', ...MODEL_MAP['claude-sonnet-4-6'] };
  }
  if (lower.includes('pro') && !lower.includes('gpt')) {
    return { key: 'gemini-3.1-pro-high', ...MODEL_MAP['gemini-3.1-pro-high'] };
  }
  if (lower.includes('flash') || lower.includes('gemini')) {
    return { key: 'gemini-3.8-flash-high', ...MODEL_MAP['gemini-3.8-flash-high'] };
  }
  if (lower.includes('gpt-oss') || lower.includes('oss-120b')) {
    return { key: 'gpt-oss-120b-medium', ...MODEL_MAP['gpt-oss-120b-medium'] };
  }

  // Default fallback - guaranteed to have a valid numeric value
  return { key: DEFAULT_MODEL_KEY, ...MODEL_MAP[DEFAULT_MODEL_KEY] };
}

module.exports = {
  MODEL_MAP,
  DEFAULT_MODEL_KEY,
  resolveModel,
};
