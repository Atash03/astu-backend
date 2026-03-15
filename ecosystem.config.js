module.exports = {
  apps: [
    {
      name: "astu-backend",
      script: "src/web_server/srv.ts",
      interpreter: "bun",
      interpreter_args: "--env-file=.env.production",                                                                                                                                                          
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3030,
        HOST: "127.0.0.1",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
