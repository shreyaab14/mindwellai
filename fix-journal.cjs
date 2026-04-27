const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'journal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted interface declaration
content = content.replace(
  /^\s*title: string;\s*content: string;\s*mood\?: string;\s*tags: string\[\];\s*createdAt: string;\s*updatedAt: string;\s*}/m,
  `interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed client/src/pages/journal.tsx');
