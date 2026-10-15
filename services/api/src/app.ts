import Fastify, { type FastifyInstance } from 'fastify';
import corsPlugin from './plugins/cors.js';
import swaggerPlugin from './plugins/swagger.js';
import { healthRoutes } from './routes/health/index.js';
import { embedRoutes } from './routes/embed/index.js';
import { dashboardRoutes } from './routes/dashboards/index.js';
import { dataSourceRoutes } from './routes/datasources/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    ajv: {
      customOptions: {
        strict: false,
        keywords: ['example'],
      },
    },
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Plugins
  await fastify.register(corsPlugin);
  await fastify.register(swaggerPlugin);

  // Modular Routes
  await fastify.register(healthRoutes);
  await fastify.register(embedRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(dataSourceRoutes);

  return fastify;
}
