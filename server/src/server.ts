import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(` LifeLine API Server Running`);
  console.log(` Port:        ${env.PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Health:      http://localhost:${env.PORT}/health`);
  console.log(` API Health:  http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  console.log(`===============================================`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close if server hasn't closed in 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
