const { spawn } = require('child_process');

console.log('🚀 Démarrage du serveur...');

const server = spawn('npx', ['ts-node', '--transpile-only', 'src/server.ts'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' }
});

server.on('error', (error) => {
  console.error('❌ Erreur:', error);
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
  process.exit(0);
});