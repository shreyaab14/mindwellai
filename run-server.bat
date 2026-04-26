@echo off
cd /d "c:\Users\Shreya Bhise\Downloads\MindWellAI\MindWellAI"
set NODE_ENV=development
npx tsx server/index.ts > server.log 2>&1

