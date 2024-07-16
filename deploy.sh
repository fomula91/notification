# Check if Xvfb is already running
# if pgrep Xvfb > /dev/null 2>&1; then
#   echo "Xvfb is already running."
# else
#   echo "Starting Xvfb..."
#   # Remove the lock file if it exists
#   rm -f /tmp/.X99-lock
#   # Start Xvfb
#   Xvfb :99 -screen 0 1920x1080x16 &
#   XVFB_PID=$!
#   echo "Xvfb started with PID $XVFB_PID."
# fi

# Export display
export DISPLAY=:1

# Navigate to the project directory
cd /home/${USER}/notification

# Install dependencies
npm install

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