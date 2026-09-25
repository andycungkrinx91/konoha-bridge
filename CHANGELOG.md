# Changelog

All notable changes to the **Konoha Bridge** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-09-25

### ⚡ Performance & Sub-3s Response Goals

- **Sub-3s Response Latency**: Removed artificial 2000ms queue cooldown delay in `src/sidecar/raw.js` and cached active sidecar ports (`ctx.activeLsPort`), eliminating repetitive `GetStatus` roundtrip pings before every inference. Requests now respond within 1–3s matching direct Antigravity IDE/CLI speed.
- **Persistent HTTP/2 Connection Pooling**: Implemented active `ClientHttp2Session` connection pooling and CA certificate caching in `src/sidecar/rpc.js`. Connections remain warm and multiplexed, eliminating per-request TCP and TLS handshakes.
- **Zero Request Throttling**: Set default request interval cooldown to 0ms and relaxed deduplication to allow high-throughput agent loops (OpenCode, Claude Code, Pi) without artificial 429 rate limit errors.
- **Increased Concurrency**: Raised max concurrent requests from 3 to 10 for parallel subagent workflows.

### 🌊 Instant Streaming Architecture

- **Instant TTFB (< 10ms)**: Stream headers and initial events (`message_start` in Anthropic, initial role chunks in OpenAI) are dispatched immediately without artificial 20s or 2s pre-stream delays.
- **Smooth Incremental Chunking**: Text deltas are streamed in smooth incremental chunks with periodic 2.5s keepalive pings, ensuring Claude Code, OpenCode, and Pi never encounter read timeouts.

### 📚 Massive Long Context Support

- **Model-Aware Context Windows**: Added dynamic context limit resolution supporting up to 1,000,000 tokens for Gemini models, 200,000 tokens for Claude models, and 128,000 tokens for GPT models.
- **Tool Result Preservation**: Increased tool content truncation threshold from 2,000 to 100,000 characters, preventing file contents and diffs from being clipped during agent coding sessions.
- **95% Compression Boundary**: Relaxed compression threshold from 70% to 95%, preserving entire conversation histories without dropping earlier messages prematurely.

### 🧪 Testing & Documentation

- **Expanded Test Suite**: Added `test/sanitize.test.js` and `test/streaming.test.js`, bringing total passing test suite to 139 tests.
- **Updated Documentation**: Updated `README.md`, `GEMINI.md`, and package metadata for v1.6.0 release.

## [1.5.0] - 2026-09-16

### 🐛 Bug Fixes & Model Alignment

- **Fix 404 NOT_FOUND on Gemini Flash Models (3.6 to 3.8)**: Corrected sidecar enum routing across `VALUE_TO_MODEL_ENUM` in `src/handlers/openai.js`, `src/handlers/anthropic.js`, and `src/handlers/gemini.js` to route all active Flash model variants (1046–1054) to `'MODEL_PLACEHOLDER_M18'`. This resolves the upstream Google API error (`Upstream model provider error: NOT_FOUND (code 404): Requested entity was not found`).
- **Strict Antigravity Model Alignment**: Removed deprecated Gemini 3.5 models to strictly match what Antigravity officially serves (14 canonical models across Flash 3.6/3.7/3.8, Pro 3.1, Claude 4.6, and GPT-OSS 120B).
- **Model Convenience Shortcuts**: Added canonical short aliases (`gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-flash`, `flash`) for seamless invocation across CLI tools and external clients.

### 🧪 Testing, Quality & Documentation

- **ResolveModel Test Coverage**: Validated model resolution and alias mapping for all 14 official models (132 unit tests total).
- **Animated Architecture Flow Diagram**: Created an animated SVG/GIF flow diagram in `README.md` (`assets/architecture-flow.gif`) featuring animated dotted request/response paths with zero visual overlap.
- **Zero-AI-Slop Code Quality Gate**: Reached a clean 100/100 `aislop` health score (0 errors, 0 warnings across all 5 engines) by declaring `@types/vscode` and stripping narrative comment noise.
- **Author & Community Support**: Added Saweria (Buy Me a Coffee) and LinkedIn profile links across documentation and `package.json` metadata.
- **Updated Documentation**: Updated `README.md`, `GEMINI.md`, and `CHANGELOG.md` with 1.5.0 VSIX installation instructions, model alias mappings, and architecture notes.

## [1.4.0] - 2026-09-03

### ✨ New Features & Model Synchronization

- **Gemini 3.8 Flash Models**: Added complete support for `gemini-3.8-flash-high` (1053), `gemini-3.8-flash-medium` (1052), and `gemini-3.8-flash-low` (1054) across OpenAI (`/v1/chat/completions`), Anthropic (`/v1/messages`), and Gemini (`/v1beta/models/*`) API endpoints.
- **100% Antigravity Alignment**: Synchronized the official active models list directly with Antigravity (`agy models`), offering all 14 canonical models with matching display names and metadata.
- **Canonical Model IDs**: Updated `gpt-oss-120b-medium` to be the primary visible model ID in `/v1/models`, preserving `gpt-oss-120b` as a backward-compatible alias.

### 🐛 Bug Fixes

- **POSIX File URI Slicing**: Fixed path slicing in `extractImages` (`src/images.js`) on Linux/macOS so `file:///home/...` correctly preserves the leading slash instead of creating relative paths.
- **POSIX Workspace URI Normalization**: Fixed `resolveWorkspace` (`src/workspace.js`) on POSIX systems to prevent quadruple slashes (`file:////...`), ensuring standard RFC 8089 URIs (`file:///...`).
- **Startup Attempt Logging**: Fixed `startupAttempt` counter order in `src/extension.js` so actual attempt counts are logged accurately before counter reset.

### 🧪 Testing & Docs

- **Expanded Test Suite**: Added resolveModel unit tests for Gemini 3.8 models, aliases, and 14-model visible list validation, reaching 132 passing tests.
- **Updated Documentation**: Fully refreshed `README.md`, `GEMINI.md`, and `CHANGELOG.md` with complete API endpoint tables, multi-protocol guides, and configuration snippets.

## [1.3.0] - 2026-08-16

### ✨ New Features & Enhancements

- **Gemini 3.7 Flash Models**: Added full support for `gemini-3.7-flash-medium` (1049), `gemini-3.7-flash-high` (1050), and `gemini-3.7-flash-low` (1051) across OpenAI (`/v1/chat/completions`), Anthropic (`/v1/messages`), and Gemini (`/v1beta/models/*`) API handlers, including `opencode` templates and backward compatibility aliases.
- **Master Development Symlink**: Standardized development symlink path to `~/.antigravity-ide/extensions/andycungkrinx91.konoha-bridge-master-universal`.

## [1.2.0] - 2026-08-01

### 🐛 Bug Fixes

- **Startup Race Condition**: Server now retries with exponential backoff (up to 12 attempts) when the sidecar isn't ready yet, fixing the issue where the bridge never started listening on first launch.
- **H2 Interceptor Teardown**: Added missing `h2Interceptor.uninstall(ctx)` to prevent `TypeError` on extension reload — `deactivate()` now correctly calls `uninstall()`.

### ✨ Improvements

- Added startup retry logging so users can see retry attempts in the output channel.
- H2 interceptor now clears captured payloads on teardown to prevent stale debug data across reloads.

## [1.1.0] - 2026-07-28

### ⚡ Automatic Startup & Installation Improvements

- **Auto-Start Activation**: Added `"onStartupFinished"` to `activationEvents` in `package.json` to guarantee instant server startup on port `1313`.
- **Standalone Antigravity IDE Support**: Configured full compatibility for standalone binary installations (`~/.local/share/antigravity-ide/`).

### 🐛 Bug Fixes & Improvements

- **HTTP/2 Interceptor Teardown**: Added missing `h2Interceptor.uninstall(ctx)` call in `deactivate()` to guarantee clean uninstallation of HTTP/2 network patches upon extension reload.
- **Model Registry Cleanup**: Removed legacy `gemini-3.5-flash-*` entries. Updated default model fallback to `gemini-3.6-flash-medium`.
- **Settings & Documentation**: Fixed Mermaid architecture diagram syntax and updated documentation across `README.md`, `GEMINI.md`, and `CLAUDE.md`.

### ✨ New Features & Enhancements

- **Gemini 3.6 Flash Models**: Added full support for `gemini-3.6-flash-medium` (1046), `gemini-3.6-flash-high` (1047), and `gemini-3.6-flash-low` (1048) across OpenAI, Anthropic, and Gemini API handlers.

## [1.0.0] - 2026-06-28

### 🍃 Initial Release of Konoha Bridge Fork

This is the first official release of **Konoha Bridge**, a customized fork of [`ag-local-bridge`](https://github.com/marcodiniz/ag-local-bridge) by [Marco Diniz](https://github.com/marcodiniz).

#### ✨ Customizations & Enhancements

- **Rebranding & Identity**: Updated extension package metadata to `konoha-bridge` with publisher `andycungkrinx91`.
- **Default HTTP Port**: Configured local OpenAI-compatible API server to run on port `1313` (`http://localhost:1313/v1`).
- **Eager Background Activation**: Configured `activationEvents` to `["*"]` to guarantee instant server activation upon opening Antigravity IDE.
- **Enhanced Multi-OS Sidecar Discovery**: Hardened process inspection across Linux (x64/ARM64), Windows (x64/ARM64), and macOS (Apple Silicon/Intel). Added +300 process ranking score for Antigravity IDE processes to isolate them from CLI instances.
- **Comprehensive `opencode` Support**: Built full configuration templates for `opencode` supporting all 8 active models with context window limits and multimodal input definitions.
- **Enriched Operational Test Suite**: Added enriched `curl` testing commands covering models listing, non-streaming, streaming SSE, vision base64 attachments, and workspace context headers.
- **Code Quality & Upgraded Modules**: Resolved all ESLint warnings (0 errors, 0 warnings) and upgraded dependencies to latest versions (`@bufbuild/protobuf@2.12.1`, `eslint@10.6.0`, `prettier@3.9.0`).

#### 📜 Upstream Attribution

- Built upon the original architecture created by Marco Diniz under the terms of the MIT License.
