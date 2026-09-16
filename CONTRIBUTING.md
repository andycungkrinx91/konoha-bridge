# Contributing to Konoha Bridge

Thank you for your interest in contributing to **Konoha Bridge**! We welcome bug reports, improvements, and pull requests.

---

## 🛠️ Local Development Setup

To test changes live inside **Antigravity IDE**, use the universal extension symlink method:

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/andycungkrinx91/konoha-bridge.git
cd konoha-bridge
npm install
```

> [!NOTE]
> Running `npm install` automatically triggers the `prepare` script, which installs the local pre-commit hook into `.git/hooks/pre-commit`.

### 2. Symlink to Antigravity Extensions Directory

Create a symlink pointing directly to your local clone:

**Linux / macOS:**

```bash
mkdir -p ~/.antigravity-ide/extensions
ln -s "$(pwd)" ~/.antigravity-ide/extensions/andycungkrinx91.konoha-bridge-master-universal
```

**Windows (PowerShell as Administrator):**

```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.antigravity-ide\extensions\andycungkrinx91.konoha-bridge-master-universal" -Target (Get-Location).Path
# Or run the included deploy script:
npm run dev:deploy
```

### 3. Reload Antigravity IDE

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and run:
`Developer: Reload Window`

---

## 🎨 Code Style & Quality Standards

We enforce strict code consistency across the codebase:

- **Strict Mode**: Every JavaScript file must start with `'use strict';`.
- **Formatting**: Enforced by [Prettier](.prettierrc) (Single quotes, 2-space indent, 120-char print width, trailing commas, semicolons).
- **Linting**: Enforced by [ESLint v10](eslint.config.js) (`eqeqeq` error, unused variables warning).
- **Zero Console Logging in Extension**: All logging must route through `log()` or `verboseLog()` in `src/utils.js` (never `console.log` or disk writes).

---

## 🔒 Local Pre-Commit Quality Pipeline

> [!IMPORTANT]
> **This repository does not use remote CI runners (e.g. GitHub Actions).**
> All linting, formatting, and unit tests are verified **locally** before commits are created.

Before committing or opening a Pull Request, run the full verification pipeline:

```bash
# Auto-fix formatting
npm run format

# Run ESLint
npm run lint

# Run all unit tests
npm test
```

Or as a single command:

```bash
npm run format && npm run lint && npm test
```

The pre-commit hook (`.githooks/pre-commit`) will block commits if formatting, linting, or tests fail.

---

## 🧪 Testing Guidelines

- Tests use **Node's native test runner** (`node:test`) — no external test framework dependencies required.
- Place tests in `test/*.test.js`.
- Mock VS Code APIs via `test/__mocks__/vscode.js` (loaded by `test/setup.js`).
- Use `assert` from `node:assert/strict` (never `console.assert`).

---

## 🚀 Submitting a Pull Request

1. Fork the repository and create a feature branch from `master`.
2. Make your modifications (strictly adhering to the scope of your feature or fix).
3. Ensure all tests pass and your code is formatted: `npm run format && npm run lint && npm test`.
4. Commit your changes with clear, descriptive commit messages.
5. Push to your fork and submit a Pull Request to `master`.

---

## ☕ Support & Connect

- ☕ **Buy Me a Coffee (Saweria)**: [https://saweria.co/andycungkrinx](https://saweria.co/andycungkrinx)
- 💼 **LinkedIn Profile**: [Andy Setiyawan](https://www.linkedin.com/in/andy-setiyawan-452396170/)
