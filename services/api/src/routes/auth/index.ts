import type { FastifyPluginAsync } from 'fastify';
import { auth } from '../../lib/auth.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Fastify route handler for Better Auth
  fastify.all('/api/auth/*', async (request, reply) => {
    try {
      const url = `${request.protocol}://${request.hostname}${request.url}`;
      const headers = new Headers();

      for (const [key, value] of Object.entries(request.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      const isPostOrPut = ['POST', 'PUT', 'PATCH'].includes(request.method);
      const req = new Request(url, {
        method: request.method,
        headers,
        body: isPostOrPut && request.body ? JSON.stringify(request.body) : undefined,
      });

      const response = await auth.handler(req);

      reply.status(response.status);

      response.headers.forEach((value, key) => {
        // Support multiple Set-Cookie headers
        if (key.toLowerCase() === 'set-cookie') {
          reply.header(key, value);
        } else {
          reply.header(key, value);
        }
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        return reply.send(json);
      } else {
        const text = await response.text();
        return reply.send(text);
      }
    } catch (err) {
      request.log.error(err, 'Better Auth Error');
      return reply.status(500).send({
        error: 'Authentication failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  // Helper route to get current user/session info or active demo context
  fastify.get('/api/v1/auth/context', async (request) => {
    const authHeader = request.headers.authorization;
    return {
      authenticated: Boolean(authHeader),
      organizations: [
        {
          id: 'org_acme_corp',
          name: 'Acme SaaS Corp',
          slug: 'acme-corp',
          role: 'owner',
          active: true,
        },
        {
          id: 'org_stripe_demo',
          name: 'Stripe Analytics',
          slug: 'stripe-analytics',
          role: 'admin',
          active: false,
        },
      ],
      user: {
        id: 'usr_founder_01',
        name: 'Alex Morgan',
        email: 'alex@loomina.dev',
        role: 'superadmin',
      },
    };
  });
};
