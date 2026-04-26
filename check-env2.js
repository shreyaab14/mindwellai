const fs = require('fs');
const path = require('path');

const outputFile = 'c:/Users/Shreya Bhise/Downloads/MindWellAI/MindWellAI/env-check2.log';
let output = '';
output += `Node version: ${process.version}\n`;
output += `Platform: ${process.platform}\n`;
output += `CWD: ${process.cwd()}\n`;
output += `Script dir: ${__dirname}\n`;

try {
  const cwd = process.cwd();
  const nodeModulesExists = fs.existsSync(path.join(cwd, 'node_modules'));
  output += `node_modules exists in CWD: ${nodeModulesExists}\n`;
  
  const pkgExists = fs.existsSync(path.join(cwd, 'package.json'));
  output += `package.json exists in CWD: ${pkgExists}\n`;
  
  if (!pkgExists) {
    output += `WARNING: package.json NOT found in CWD!\n`;
    output += `Files in CWD: ${fs.readdirSync(cwd).join(', ')}\n`;
  }
} catch (e) {
  output += `Error: ${e.message}\n`;
}

fs.writeFileSync(outputFile, output);
console.log(`Wrote to ${outputFile}`);

