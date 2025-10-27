// Script to start both servers simultaneously
const { spawn } = require('child_process');

console.log('Starting both Student and Admin servers...\n');

const studentServer = spawn('node', ['student-server.js'], {
  stdio: 'inherit',
  shell: true
});

const adminServer = spawn('node', ['admin-server.js'], {
  stdio: 'inherit',
  shell: true
});

studentServer.on('error', (error) => {
  console.error(`Student server error: ${error}`);
});

adminServer.on('error', (error) => {
  console.error(`Admin server error: ${error}`);
});

process.on('SIGINT', () => {
  studentServer.kill();
  adminServer.kill();
  process.exit();
});
