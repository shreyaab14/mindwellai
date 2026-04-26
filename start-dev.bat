@echo off
set NODE_ENV=development
npx tsx server/index.ts > dev-output.log 2>&1

