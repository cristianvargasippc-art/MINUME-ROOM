module.exports = {
  apps: [
    {
      name: 'minume-api',
      script: './backend/server.js',
      cwd: '/var/www/minume-api',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/pm2/minume-api-error.log',
      out_file: '/var/log/pm2/minume-api-out.log',
      log_file: '/var/log/pm2/minume-api-combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
  deploy: {
    production: {
      user: 'root',
      host: 'TU_IP_VPS',
      ref: 'origin/main',
      repo: 'https://github.com/TU_USUARIO/MINUME-ROOM.git',
      path: '/var/www/minume-api',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm ci --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};