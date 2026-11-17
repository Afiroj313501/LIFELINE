import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocketServer } from './services/socket';

const app = createApp();
const httpServer = http.createServer(app);

// Initialize real-time Socket.IO gateway
const io = initSocketServer(httpServer);

const server = httpServer.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(` LifeLine API & WebSocket Server Running`);
  console.log(` Port:        ${env.PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Health:      http://localhost:${env.PORT}/health`);
  console.log(` API Health:  http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  console.log(` WebSocket:   Enabled (Socket.IO v4)`);
  console.log(`===============================================`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  io.close(() => {
    console.log('Socket.IO connections closed.');
  });
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
