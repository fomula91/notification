module.exports = {
  apps: [
    {
      name: "app",
      script: "./app.js",
      instances: 1,
      exec_mode: "fork",
      node_args: "--max-old-space-size=4096",
      env: {
        NODE_ENV: "development",
        DISPLAY: ":99",
      },
      env_production: {
        NODE_ENV: "production",
        DISPLAY: ":99",
      },
      watch: true,
    },
  ],
};
