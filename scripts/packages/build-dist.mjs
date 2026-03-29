#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const packageDir = process.cwd();
const srcDir = path.join(packageDir, 'src');
const distDir = path.join(packageDir, 'dist');
const assetSuffixes = ['.css', '.vm.js'];

function isAssetFile(filename) {
  return assetSuffixes.some((suffix) => filename.endsWith(suffix));
}

async function walkAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkAssets(fullPath)));
      continue;
    }
    if (entry.isFile() && isAssetFile(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function runTscBuild() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['exec', 'tsc', '-b', '--force'], {
    cwd: packageDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function copyAssets() {
  const assets = await walkAssets(srcDir);
  for (const sourcePath of assets) {
    const relativePath = path.relative(srcDir, sourcePath);
    const targetPath = path.join(distDir, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }
  return assets.length;
}

await rm(distDir, { recursive: true, force: true });
runTscBuild();
const copiedCount = await copyAssets();
console.log(`Copied ${copiedCount} asset file(s) into ${path.relative(packageDir, distDir) || 'dist'}.`);
