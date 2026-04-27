const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'storage.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted import line
content = content.replace(
  /import\s*\n\s*import { eq, desc } from "drizzle-orm";/,
  'import { db, hasDatabase } from "./db";\nimport { eq, desc } from "drizzle-orm";'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed server/storage.ts import');
