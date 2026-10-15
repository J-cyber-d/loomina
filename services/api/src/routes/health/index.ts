import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Loomina API Gateway liveness and readiness probe',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              engine: { type: 'string', example: 'Loomina API Gateway' },
              version: { type: 'string', example: '0.1.0' },
              timestamp: { type: 'string', example: '2026-10-15T15:30:00.000Z' },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        engine: 'Loomina API Gateway',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
      };
    }
  );
};
