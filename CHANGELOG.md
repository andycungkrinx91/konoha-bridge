# Changelog

All notable changes to the **Konoha Bridge** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
