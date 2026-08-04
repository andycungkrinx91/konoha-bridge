# Changelog

All notable changes to the **Konoha Bridge** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
