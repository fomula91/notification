module.exports = {
  apps: [
    {
      name: "xvfb",
      script: "bash",
      args: "-c 'Xvfb :99 -screen 0 1920x1080x24'",
      autorestart: false,
      watch: false,
      env: {
        DISPLAY: ":99",
      },
    },
    {
      name: "app",
      script: "xvfb-run",
      args: "-a node ./app.js",
      instances: 1,
      exec_mode: "cluster",
      node_args: "--max-old-space-size=4096",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      wait_ready: true,
      autorestart: true,
      watch: true,
      restart_delay: 5000,
      post_stop: "pkill Xvfb",
      pre_start: "Xvfb :99 -screen 0 1920x1080x24 &",
    },
  ],
};
