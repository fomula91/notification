# Start Xvfb
Xvfb :99 -screen 0 1920x1080x16 &
XVFB_PID=$!

# Export display
export DISPLAY=:99

# Install dependencies
npm install

# Navigate to the project directory
cd /home/${USER}/notification

# Check if Playwright is installed
if ! npm list playwright > /dev/null 2>&1; then
  echo "Playwright is not installed. Installing..."
  npm install playwright
else
  echo "Playwright is already installed."
fi

# Stop any running instances of the application
pm2 stop all

# Start the application with PM2
pm2 start ecosystem.config.js --env production