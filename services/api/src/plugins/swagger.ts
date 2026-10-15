import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export default fp(async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Loomina Developer API Gateway',
        description:
          'High-performance Embedded Analytics Platform API. Manages dashboard metadata, dynamic data source connections, and sub-millisecond guest JWT issuance.',
        version: '0.1.0',
        contact: {
          name: 'Loomina Engineering Team',
          url: 'https://loomina.dev',
        },
      },
      servers: [
        {
          url: 'http://localhost:4000',
          description: 'Local Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'HMAC-SHA256 signed guest embed JWT token for tenant-isolated queries.',
          },
          apiKeyAuth: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'Developer secret key (lm_live_...) for server-to-server operations.',
          },
        },
      },
      tags: [
        { name: 'Dashboards', description: 'Dashboard configuration and widget layout CRUD' },
        { name: 'Embed', description: 'Stateless guest JWT token issuance and verification' },
        {
          name: 'Data Sources',
          description:
            'Multi-tenant customer database connections (PostgreSQL, ClickHouse, Snowflake)',
        },
        { name: 'Health', description: 'System health check and diagnostic ping' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });
});
