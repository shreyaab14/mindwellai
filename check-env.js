const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let output = '';
output += `Node version: ${process.version}\n`;
output += `Platform: ${process.platform}\n`;
output += `CWD: ${process.cwd()}\n`;

try {
  const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
  output += `node_modules exists: ${nodeModulesExists}\n`;
  
  const tsxPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsx.cmd');
  output += `tsx exists: ${fs.existsSync(tsxPath)}\n`;
  
  const vitePath = path.join(process.cwd(), 'node_modules', '.bin', 'vite.cmd');
  output += `vite exists: ${fs.existsSync(vitePath)}\n`;
  
  const serverIndexPath = path.join(process.cwd(), 'server', 'index.ts');
  output += `server/index.ts exists: ${fs.existsSync(serverIndexPath)}\n`;
  
  const distPath = path.join(process.cwd(), 'dist');
  output += `dist exists: ${fs.existsSync(distPath)}\n`;
  
  const envPath = path.join(process.cwd(), '.env');
  output += `.env exists: ${fs.existsSync(envPath)}\n`;
  
} catch (e) {
  output += `Error: ${e.message}\n`;
}

fs.writeFileSync('env-check.log', output);
console.log('Check complete. See env-check.log');

