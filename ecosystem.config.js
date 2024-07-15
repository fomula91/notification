module.exports = {
  apps: [
    {
      name: "app",
      script: "./app.js",
      instances: 1,
      exec_mode: "cluster",
      watch: true,
      node_args: "--max-old-space-size=4096",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
