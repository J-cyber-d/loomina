import Fastify, { type FastifyInstance } from 'fastify';
import corsPlugin from './plugins/cors.js';
import swaggerPlugin from './plugins/swagger.js';
import { healthRoutes } from './routes/health/index.js';
import { embedRoutes } from './routes/embed/index.js';
import { dashboardRoutes } from './routes/dashboards/index.js';
import { dataSourceRoutes } from './routes/datasources/index.js';
import { authRoutes } from './routes/auth/index.js';
import { apiKeyRoutes } from './routes/api-keys/index.js';
import { queryRoutes } from './routes/query/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || 'info';

  const fastify = Fastify({
    disableRequestLogging: true,
    ajv: {
      customOptions: {
        strict: false,
        keywords: ['example'],
      },
    },
    logger: isProduction
      ? {
          level: logLevel,
          formatters: {
            level: (label) => ({ level: label }),
          },
          timestamp: () => `,"time":"${new Date().toISOString()}"`,
        }
      : {
          level: logLevel,
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname,reqId',
            },
          },
        },
  });

  // Clean, single-line aligned request completion logger
  fastify.addHook('onResponse', (request, reply, done) => {
    const elapsed = reply.elapsedTime.toFixed(1);
    const status = reply.statusCode;
    const method = request.method;
    const url = request.url;

    if (status >= 500) {
      request.log.error(`${method} ${url} ${status} (${elapsed}ms)`);
    } else if (status >= 400) {
      request.log.warn(`${method} ${url} ${status} (${elapsed}ms)`);
    } else {
      request.log.info(`${method} ${url} ${status} (${elapsed}ms)`);
    }
    done();
  });

  // Global Error Handler for structured exception handling & response normalization
  fastify.setErrorHandler(
    (
      error: Error & {
        statusCode?: number;
        code?: string;
        validation?: unknown;
        validationContext?: string;
      },
      request,
      reply
    ) => {
      // 1. Schema Validation Failures (Fastify AJV validation)
      if (error.validation) {
        request.log.warn(
          {
            reqId: request.id,
            method: request.method,
            url: request.url,
            validation: error.validation,
            validationContext: error.validationContext,
          },
          'Request validation rejected'
        );
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
          details: error.validation,
        });
      }

      // 2. Client-side Expected HTTP Errors (4xx)
      const statusCode = error.statusCode || 500;
      if (statusCode < 500) {
        request.log.warn(
          {
            reqId: request.id,
            method: request.method,
            url: request.url,
            statusCode,
            message: error.message,
          },
          'Client request rejected'
        );
        return reply.status(statusCode).send({
          statusCode,
          error: error.name || 'ClientError',
          message: error.message,
        });
      }

      // 3. Server-side Unexpected Exceptions (5xx)
      request.log.error(
        {
          err: {
            message: error.message,
            stack: error.stack,
            code: error.code,
          },
          reqId: request.id,
          method: request.method,
          url: request.url,
        },
        'Uncaught Server Exception'
      );

      return reply.status(500).send({
        statusCode: 500,
        error: 'InternalServerError',
        message: isProduction ? 'An unexpected internal error occurred' : error.message,
      });
    }
  );

  // Custom 404 Not Found Handler
  fastify.setNotFoundHandler((request, reply) => {
    request.log.warn(
      {
        reqId: request.id,
        method: request.method,
        url: request.url,
      },
      'Route not found'
    );
    return reply.status(404).send({
      statusCode: 404,
      error: 'NotFound',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // Plugins
  await fastify.register(corsPlugin);
  await fastify.register(swaggerPlugin);

  // Modular Routes
  await fastify.register(healthRoutes);
  await fastify.register(embedRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(dataSourceRoutes);
  await fastify.register(authRoutes);
  await fastify.register(apiKeyRoutes);
  await fastify.register(queryRoutes);

  return fastify;
}
