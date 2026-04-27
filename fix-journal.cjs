const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/pages/journal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted interface block
const corruptedPattern = /import \{ useToast \} from "@\/hooks\/use-toast";\s*\n\s*\n\s+mood\?: string;/;
const fixedBlock = `import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;`;

content = content.replace(corruptedPattern, fixedBlock);

fs.writeFileSync(filePath, content);
console.log('Fixed journal.tsx interface block');
