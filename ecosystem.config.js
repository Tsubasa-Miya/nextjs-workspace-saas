/* istanbul ignore file */
module.exports = {
  apps: [
    {
      name: 'saas-starter',
      script: 'node .next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
