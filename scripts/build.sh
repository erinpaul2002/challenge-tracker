#!/bin/bash

if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "Building for main branch with Convex deploy..."
  npx convex deploy --cmd='npm run next:build'
else
  echo "Building for non-main branch (dev)..."
  npm run next:build
fi
