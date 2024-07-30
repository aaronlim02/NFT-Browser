const { execSync } = require('child_process');
const path = require('path');


// Path to the root directory
const rootDir = __dirname;


// Path to the server directory
const serverDir = path.join(__dirname, 'python');


try {


  // Execute each command
  process.chdir(rootDir);
  execSync('python -m venv .venv', { stdio: 'inherit' });
  execSync('.venv\\Scripts\\activate && pip install -r python/requirements.txt', { stdio: 'inherit' });


  console.log('Python environment setup completed successfully.');
} catch (error) {
  console.error('Error setting up Python environment:', error);
  process.exit(1);
}
