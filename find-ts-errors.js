#!/usr/bin/env node
/**
 * TypeScript Error Finder (Improved)
 *
 * This script runs TypeScript checks across all packages and at the monorepo root.
 * It prints ALL errors from both stdout and stderr, ensuring nothing is missed.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const packages = ['common', 'backend', 'frontend'];
let hasErrors = false;

console.log('🔍 Finding TypeScript errors across all packages and at the root...\n');

// 1. Check each package individually
packages.forEach(pkg => {
  console.log(`\n📦 Checking ${pkg} package...`);
  const result = spawnSync('npx', ['tsc', '--noEmit'], {
    cwd: path.join(process.cwd(), pkg),
    encoding: 'utf8',
  });
  if (result.status === 0) {
    console.log(`✅ No errors found in ${pkg}`);
  } else {
    hasErrors = true;
    console.log(`❌ Found errors in ${pkg}:`);
    if (result.stdout) {
      console.log(result.stdout.trim());
    }
    if (result.stderr) {
      console.log(result.stderr.trim());
    }
  }
});

// 2. Check the monorepo root with project references
console.log('\n🗂️  Checking monorepo root (project references)...');
const rootResult = spawnSync('npx', ['tsc', '-b', '--noEmit'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});
if (rootResult.status === 0) {
  console.log('✅ No errors found at the monorepo root');
} else {
  hasErrors = true;
  console.log('❌ Found errors at the monorepo root:');
  if (rootResult.stdout) {
    console.log(rootResult.stdout.trim());
  }
  if (rootResult.stderr) {
    console.log(rootResult.stderr.trim());
  }
}

if (hasErrors) {
  console.log('\n❗ TypeScript errors were found. Please review the output above.');
  process.exit(1);
} else {
  console.log('\n✨ All packages and the monorepo root passed TypeScript checks!');
  process.exit(0);
}