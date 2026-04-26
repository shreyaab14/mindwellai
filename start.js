const { spawn } = require('child_process');
const fs = require('fs');

const logFile = fs.createWriteStream('server-output.log', { flags: 'w' });

process.env.NODE_ENV = 'development';

const child = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.pipe(logFile);
child.stderr.pipe(logFile);
child.stdout.on('data', d => console.log(d.toString()));
child.stderr.on('data', d => console.error(d.toString()));

fs.writeFileSync('server.pid', String(child.pid));

console.log(`Server started with PID ${child.pid}. Logs in server-output.log`);

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  try { fs.unlinkSync('server.pid'); } catch {}
});

