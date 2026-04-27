const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'lib', 'queryClient.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix getAuthHeaders return type
content = content.replace(
  /function getAuthHeaders\(\): Record<string, string> \{/,
  'function getAuthHeaders(): HeadersInit {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed client/src/lib/queryClient.ts');
