import type { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@loomina/shared';
import { createEmbedTokenSchema, verifyEmbedTokenSchema } from './schema.js';

export const embedRoutes: FastifyPluginAsync = async (fastify) => {
  // Generate embed guest token
  fastify.post(
    '/api/v1/embed/token',
    { schema: createEmbedTokenSchema },
    async (request, reply) => {
      const {
        organizationId,
        tenantId,
        allowedDashboards,
        filters,
        expiresInHours = 24,
      } = request.body as {
        organizationId: string;
        tenantId: string;
        allowedDashboards?: string[];
        filters?: Record<string, unknown>;
        expiresInHours?: number;
      };

      const secret = process.env.LOOMINA_EMBED_SECRET || 'dev_secret_key_12345';
      const now = Math.floor(Date.now() / 1000);
      const exp = now + expiresInHours * 3600;

      const payload: JWTPayload = {
        sub: `guest_${tenantId}`,
        organizationId,
        tenantId,
        allowedDashboards,
        filters,
        iat: now,
        exp,
      };

      const token = jwt.sign(payload, secret);

      request.log.info(
        {
          tenantId,
          organizationId,
          allowedDashboards,
          expiresInHours,
          expiresAt: new Date(exp * 1000).toISOString(),
        },
        'Guest embed token issued'
      );

      return reply.status(201).send({
        token,
        expiresAt: new Date(exp * 1000).toISOString(),
        tenantId,
      });
    }
  );

  // Stateless JWT verification (<0.2ms in RAM)
  fastify.post(
    '/api/v1/embed/verify',
    { schema: verifyEmbedTokenSchema },
    async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        request.log.warn({ reason: 'missing_authorization_header' }, 'Embed verification failed: missing header');
        return reply.status(401).send({ error: 'Missing or malformed Authorization header' });
      }

      const token = authHeader.split(' ')[1];
      const secret = process.env.LOOMINA_EMBED_SECRET || 'dev_secret_key_12345';

      try {
        const decoded = jwt.verify(token, secret) as JWTPayload;
        request.log.info(
          {
            tenantId: decoded.tenantId,
            orgId: decoded.organizationId,
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
          },
          'Stateless guest token verified'
        );
        return {
          valid: true,
          tenantId: decoded.tenantId,
          orgId: decoded.organizationId,
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
        };
      } catch (err) {
        request.log.warn({ err: (err as Error).message }, 'Embed verification rejected: token invalid or expired');
        return reply.status(401).send({ error: 'Invalid or expired token' });
      }
    }
  );
};
