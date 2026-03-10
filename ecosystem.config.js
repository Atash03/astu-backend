module.exports = {
  apps: [
    {
      name: "astu-backend",
      script: "src/web_server/srv.ts",
      interpreter: "bun",
      args: "--env-file=.env.production",
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
