#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const gitDir = path.join(repoRoot, '.git');
const githooksDir = path.join(repoRoot, '.githooks');
const preCommitSrc = path.join(githooksDir, 'pre-commit');

if (!fs.existsSync(gitDir)) {
  // Not a git repository (e.g. tarball / CI / package install)
  process.exit(0);
}

try {
  const gitHooksTargetDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(gitHooksTargetDir)) {
    fs.mkdirSync(gitHooksTargetDir, { recursive: true });
  }

  const targetPreCommit = path.join(gitHooksTargetDir, 'pre-commit');
  if (fs.existsSync(preCommitSrc)) {
    const hookContent = fs.readFileSync(preCommitSrc, 'utf8');
    fs.writeFileSync(targetPreCommit, hookContent, { mode: 0o755 });
    try {
      fs.chmodSync(targetPreCommit, 0o755);
    } catch (_) {}
    console.log('✅ Local pre-commit hook installed to .git/hooks/pre-commit');
  }
} catch (err) {
  console.warn('⚠️ Could not configure git pre-commit hook automatically:', err.message);
}
