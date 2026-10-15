import 'dotenv/config';
import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 4000;
  const host = '0.0.0.0';

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
