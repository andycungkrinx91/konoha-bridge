<p align="center">
  <h1 align="center">🍃 Konoha Bridge (AG Local Bridge)</h1>
  <p align="center">
    <strong>Exposes your running Antigravity IDE instance as a local OpenAI-compatible API on <code>localhost:1313</code></strong>
  </p>
</p>

<p align="center">
  <a href="https://github.com/andycungkrinx91/konoha-bridge/stargazers"><img src="https://img.shields.io/github/stars/andycungkrinx91/konoha-bridge?style=for-the-badge&color=gold" alt="GitHub Stars"></a>
  <a href="https://github.com/andycungkrinx91/konoha-bridge/issues"><img src="https://img.shields.io/github/issues/andycungkrinx91/konoha-bridge?style=for-the-badge&color=red" alt="GitHub Issues"></a>
  <a href="https://github.com/andycungkrinx91/konoha-bridge/blob/master/LICENSE"><img src="https://img.shields.io/github/license/andycungkrinx91/konoha-bridge?style=for-the-badge&color=blue" alt="License"></a>
</p>

<p align="center">
  <strong>Tech Stack & Platform Badges:</strong><br>
  <img src="https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/VS_Code_Extension-1.85%2B-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="VS Code Extension">
  <img src="https://img.shields.io/badge/Protobuf-v2.12-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Protobuf">
  <img src="https://img.shields.io/badge/OpenAI_API-Compatible-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI API">
  <img src="https://img.shields.io/badge/Port-1313-FF6F00?style=for-the-badge&logo=fastapi&logoColor=white" alt="Port 1313">
  <img src="https://img.shields.io/badge/OS-Linux%20|%20Windows%20|%20macOS-informational?style=for-the-badge&logo=linux&logoColor=white" alt="Multi-OS">
</p>

---

> [!NOTE]
> **Credits & Acknowledgements**: This project is a customized fork of the open-source project [`ag-local-bridge`](https://github.com/marcodiniz/ag-local-bridge) created by [Marco Diniz](https://github.com/marcodiniz). All original code and licensing rights remain under the MIT License.

Use your Antigravity subscription directly with any tool that speaks OpenAI — [opencode](https://opencode.ai), [aider](https://aider.chat), [continue.dev](https://continue.dev), or plain `curl`.

---

## ⚡ How it Works

```mermaid
flowchart LR
    A["Your Tool<br/>(opencode / curl)"] -->|"HTTP :1313"| B["Konoha Bridge Extension"]
    B -->|"ConnectRPC / HTTP/2"| C["Antigravity Sidecar"]
    C -->|"Authenticated API"| D["Cloud AI Models"]
```

The extension runs inside Antigravity's process, discovers the sidecar via process inspection across Linux, Windows, and macOS, intercepts CSRF tokens from internal traffic, and proxies your requests through the authenticated sidecar channel.

---

## ✨ Features

- 🎯 **OpenAI-compatible API** — Drop-in replacement for any tool expecting OpenAI standard endpoints.
- 🖼️ **Image & Vision Support** — Paste screenshots or attach images from OpenAI clients; images are saved to temp files and referenced for agent inspection.
- 📁 **Workspace-Aware** — Automatically detects and sets project context via `x-workspace-dir` / `x-workspace-uri` headers.
- 🔄 **Conversation Multiplexing** — Reuses active Cascade conversations efficiently with automatic backoff retry on capacity limits.
- ⚡ **Streaming & Non-Streaming** — Real-time Server-Sent Events (SSE) streaming and full JSON payload completions.
- 🛡️ **Cross-OS Native** — Auto-discovers sidecar processes seamlessly on Linux, Windows, and macOS.

---

## 🤖 Available Models

| Model ID                   | Provider  | Description                     | Context Window   |
| :------------------------- | :-------- | :------------------------------ | :--------------- |
| `gemini-3.6-flash-medium`  | Google    | Gemini 3.6 Flash (Medium) Fast  | 1,048,576 tokens |
| `gemini-3.6-flash-high`    | Google    | Gemini 3.6 Flash (High) Fast    | 1,048,576 tokens |
| `gemini-3.6-flash-low`     | Google    | Gemini 3.6 Flash (Low) Fast     | 1,048,576 tokens |
| `gemini-3.1-pro-high`      | Google    | Gemini 3.1 Pro — High thinking  | 1,048,576 tokens |
| `gemini-3.1-pro-low`       | Google    | Gemini 3.1 Pro — Low thinking   | 1,048,576 tokens |
| `claude-sonnet-4-6`        | Anthropic | Claude Sonnet 4.6 with Thinking | 200,000 tokens   |
| `claude-opus-4-6-thinking` | Anthropic | Claude Opus 4.6 with Thinking   | 200,000 tokens   |
| `gpt-oss-120b`             | OpenAI    | GPT-OSS 120B Medium             | 128,000 tokens   |

---

## 📦 Installation

### Live Development Symlink (Recommended)

To run your live customized repository directly inside Antigravity IDE:

```bash
# Linux
ln -s /path/to/konoha-bridge ~/.antigravity-ide/extensions/andycungkrinx91.konoha-bridge-1.1.0-universal

# macOS
ln -s /path/to/konoha-bridge ~/.antigravity-ide/extensions/andycungkrinx91.konoha-bridge-1.1.0-universal

# Windows (PowerShell Administrator)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.antigravity-ide\extensions\andycungkrinx91.konoha-bridge-1.1.0-universal" -Target "C:\path\to\konoha-bridge"
```

Then reload Antigravity IDE (`Ctrl+Shift+P` → _Developer: Reload Window_).

---

## 🚀 Full `opencode` Configuration

Add the complete configuration to `~/.config/opencode/opencode.json` (or `%USERPROFILE%\.config\opencode\opencode.json` on Windows):

```json
{
  "provider": {
    "konoha-bridge": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Konoha Bridge",
      "options": {
        "baseURL": "http://localhost:1313/v1",
        "apiKey": "local"
      },
      "models": {
        "gemini-3.6-flash-medium": {
          "name": "Gemini 3.6 Flash Medium (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text"] },
          "limit": { "context": 1048576, "output": 65536 }
        },
        "gemini-3.6-flash-high": {
          "name": "Gemini 3.6 Flash High (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text", "image"] },
          "limit": { "context": 1048576, "output": 65536 }
        },
        "gemini-3.6-flash-low": {
          "name": "Gemini 3.6 Flash Low (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text"] },
          "limit": { "context": 1048576, "output": 65536 }
        },
        "gemini-3.1-pro-high": {
          "name": "Gemini 3.1 Pro High (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text"] },
          "limit": { "context": 1048576, "output": 65535 }
        },
        "gemini-3.1-pro-low": {
          "name": "Gemini 3.1 Pro Low (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text"] },
          "limit": { "context": 1048576, "output": 65535 }
        },
        "claude-sonnet-4-6": {
          "name": "Claude Sonnet 4.6 (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text", "image"] },
          "limit": { "context": 200000, "output": 64000 }
        },
        "claude-opus-4-6-thinking": {
          "name": "Claude Opus 4.6 Thinking (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text"] },
          "limit": { "context": 200000, "output": 64000 }
        },
        "gpt-oss-120b": {
          "name": "GPT-OSS 120B Medium (Antigravity)",
          "modalities": { "input": ["text", "image"], "output": ["text"] },
          "limit": { "context": 128000, "output": 16384 }
        }
      }
    }
  }
}
```

Then in `opencode`, select model identifiers formatted as `konoha-bridge/<model_id>` (e.g. `konoha-bridge/gemini-3.5-flash-medium` or `konoha-bridge/claude-sonnet-4-6`).

---

## 🧪 Enriched `curl` Testing Suite

Below is the comprehensive operational test suite for verifying port `1313` functionality:

### 1. List Available Models

```bash
curl -s http://localhost:1313/v1/models | jq .
```

### 2. Standard Chat Completion (Non-Streaming)

```bash
curl http://localhost:1313/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "Explain async/await in 2 sentences."}
    ],
    "stream": false
  }'
```

### 3. Real-Time Streaming Completion (Server-Sent Events)

```bash
curl -N http://localhost:1313/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3.1-pro-high",
    "messages": [
      {"role": "user", "content": "Write a python function to check prime numbers."}
    ],
    "stream": true
  }'
```

### 4. Vision & Multimodal Completion (Base64 Image)

```bash
curl http://localhost:1313/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3.6-flash-medium",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Describe this image in detail."},
          {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="}}
        ]
      }
    ],
    "stream": false
  }'
```

### 5. Workspace Context Execution (Custom Headers)

```bash
curl http://localhost:1313/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-workspace-dir: /home/user/my-project" \
  -d '{
    "model": "gemini-3.6-flash-medium",
    "messages": [
      {"role": "user", "content": "List the main dependencies in package.json"}
    ],
    "stream": false
  }'
```

---

## 🛠️ API Endpoints

| Method | Path                   | Description                                 |
| :----- | :--------------------- | :------------------------------------------ |
| `GET`  | `/v1/models`           | List available models                       |
| `POST` | `/v1/chat/completions` | Chat completion (streaming & non-streaming) |
| `POST` | `/v1/proxy`            | Forward arbitrary RPC to sidecar            |
| `GET`  | `/v1/debug`            | Debug info (sidecar ports, CSRF, captures)  |

---

## 📜 License & Credits

This project is licensed under the [MIT License](LICENSE).

### Original Author & Upstream Attribution

This repository is a customized fork built upon the excellent work of **Marco Diniz** ([@marcodiniz](https://github.com/marcodiniz)).

- **Original Repository**: [`marcodiniz/ag-local-bridge`](https://github.com/marcodiniz/ag-local-bridge)
- All original code, architecture patterns, and copyrights belong to their respective authors under the terms of the MIT License.
