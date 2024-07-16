# Start Xvfb
Xvfb :99 -screen 0 1920x1080x16 &
XVFB_PID=$!

# Export display
export DISPLAY=:99

# Install dependencies
npm install

# Install Playwright
npx playwright install

# Stop any running instances of the application
pm2 stop all

# Start the application with PM2
pm2 start ecosystem.config.js --env production

# Wait for the application to exit
wait $XVFB_PID