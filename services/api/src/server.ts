import 'dotenv/config';
import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 4000;
  const host = '0.0.0.0';

  // Process-level exception handling
  process.on('unhandledRejection', (reason) => {
    app.log.error({ err: reason }, 'Unhandled Promise Rejection detected');
  });

  process.on('uncaughtException', (err) => {
    app.log.fatal({ err }, 'Fatal Uncaught Exception detected! Terminating process.');
    process.exit(1);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    app.log.info({ signal }, 'Graceful shutdown signal received. Closing active connections...');
    try {
      await app.close();
      app.log.info('Server successfully closed.');
      process.exit(0);
    } catch (closeErr) {
      app.log.error({ err: closeErr }, 'Error during server shutdown.');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  try {
    await app.listen({ port, host });
    console.log(`🚀 Loomina API Gateway listening at http://localhost:${port}`);
    console.log(`📖 Interactive Swagger Documentation at http://localhost:${port}/documentation`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
