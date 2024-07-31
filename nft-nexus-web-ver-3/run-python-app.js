const { execSync } = require('child_process');
const path = require('path');


// Path to the server directory
const serverDir = path.join(__dirname, 'python');


try {
  // Change to the server directory
  process.chdir(serverDir);


  // Activate the virtual environment and run the Python application
  console.log('Activating virtual environment and running Python application...');
  execSync(`${path.join('..', '.venv', 'Scripts', 'activate')} && python app.py`, { stdio: 'inherit', shell: true });


  console.log('Python application is running.');
} catch (error) {
  console.error('Error running Python application:', error);
  process.exit(1);
}
