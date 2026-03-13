#!/usr/bin/env node

const { execSync } = require('child_process');

const branch = process.env.VERCEL_GIT_COMMIT_REF || 'unknown';
console.log(`Building for branch: ${branch}`);

try {
  if (branch === 'main') {
    console.log('Deploying Convex and building Next.js...');
    execSync("npx convex deploy --cmd='npm run next:build'", { stdio: 'inherit' });
  } else {
    console.log('Building Next.js only...');
    execSync('npm run next:build', { stdio: 'inherit' });
  }
} catch (error) {
  process.exit(1);
}
