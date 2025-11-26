#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(workspaceRoot, 'dist');
const releaseDir = path.join(workspaceRoot, 'release');
const outputZip = path.join(releaseDir, 'tagged-bookmark-management.zip');

const run = (command, options = {}) => {
  execSync(command, {
    stdio: 'inherit',
    cwd: workspaceRoot,
    env: { ...process.env, ...options.env }
  });
};

const purgeArtifacts = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.vite') {
        rmSync(fullPath, { recursive: true, force: true });
        continue;
      }
      purgeArtifacts(fullPath);
      continue;
    }
    if (entry.name.endsWith('.map')) {
      rmSync(fullPath, { force: true });
    }
  }
};

console.log('🛠️  构建扩展...');
run('npm run build', { env: { ...process.env, ENABLE_SOURCEMAP: 'false' } });

console.log('🧹 清理调试产物...');
purgeArtifacts(distDir);

mkdirSync(releaseDir, { recursive: true });
if (existsSync(outputZip)) {
  rmSync(outputZip, { force: true });
}

console.log('📦  打包 dist 内容...');
execSync(`zip -r ${outputZip} .`, { stdio: 'inherit', cwd: distDir });

console.log(`✅ 完成：${outputZip}`);





