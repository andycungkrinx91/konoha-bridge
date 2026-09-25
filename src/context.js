'use strict';

const { randomUUID } = require('crypto');

/**
 * Shared mutable state for the AG Local Bridge extension.
 *
 * All state that was previously scattered as module-level `let` variables
 * in the monolithic extension.js is consolidated here. A single context
 * object is created in activate() and passed to every module.
 */
function createContext() {
  return {
    // Identity (for Metadata proto payloads)
    sessionId: randomUUID() + Date.now().toString(),
    extensionVersion: '1.6.0',

    // VS Code UI
    /** @type {import('vscode').OutputChannel | null} */
    outputChannel: null,
    /** @type {import('vscode').StatusBarItem | null} */
    statusBarItem: null,

    // HTTP server
    /** @type {import('http').Server | null} */
    server: null,

    // Sidecar discovery cache & active port
    sidecarInfo: null,
    sidecarInfoTimestamp: 0,
    activeLsPort: null,
    SIDECAR_CACHE_TTL: 300000, // 5 minutes (discovery is expensive on Windows)

    // Concurrency guard
    chatRequestsInFlight: 0,
    MAX_CONCURRENT_REQUESTS: 10,

    // Rate limiting / loop-breaking
    lastResponseTimestamp: 0,
    MIN_REQUEST_INTERVAL_MS: 0, // 0ms cooldown for high-throughput subagent calls
    lastUserMessageHash: '',
    lastUserMessageTimestamp: 0,
    DEDUP_WINDOW_MS: 0, // 0ms dedup for fast sequential agent turns

    // CSRF token intercepted from Antigravity's own outgoing requests
    interceptedCsrf: null,
    interceptedPort: null,

    // Interceptor originals (stored for uninstall)
    _originalHttpsRequest: null,
    _originalCreateServer: null,

    // H2 interceptor captured payloads
    capturedPayloads: [],
    MAX_CAPTURES: 20,

    // Cascade conversation state
    isWorkspaceSwitching: false,
    activeCascades: new Map(), // convKey -> { id, lastUsed }
    cascadePromises: new Map(), // convKey -> Promise<string>
  };
}

module.exports = { createContext };
