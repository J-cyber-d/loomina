import type { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { db, apiKeys } from '../../db/index.js';

// In-memory fallback if postgres is offline
const memoryApiKeys: Array<{
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}> = [
  {
    id: 'key_prod_default_01',
    organizationId: 'org_acme_corp',
    name: 'Production SaaS Embed Key',
    keyPrefix: 'lm_live_98a7sd8f...',
    hashedKey: crypto.createHash('sha256').update('lm_live_sample').digest('hex'),
    createdAt: new Date(),
    lastUsedAt: new Date(),
  },
];

export const apiKeyRoutes: FastifyPluginAsync = async (fastify) => {
  // List API keys
  fastify.get('/api/v1/api-keys', async (request) => {
    const { organizationId = 'org_acme_corp' } = request.query as { organizationId?: string };

    try {
      const keys = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          createdAt: apiKeys.createdAt,
          lastUsedAt: apiKeys.lastUsedAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.organizationId, organizationId))
        .orderBy(desc(apiKeys.createdAt));

      return keys;
    } catch {
      // Fallback to in-memory keys
      return memoryApiKeys
        .filter((k) => k.organizationId === organizationId)
        .map((k) => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt,
        }));
    }
  });

  // Create new API key
  fastify.post('/api/v1/api-keys', async (request, reply) => {
    const { organizationId = 'org_acme_corp', name = 'Default Key' } = request.body as {
      organizationId?: string;
      name?: string;
    };

    const randomPart = crypto.randomBytes(24).toString('hex');
    const secretKey = `lm_live_${randomPart}`;
    const keyPrefix = `${secretKey.slice(0, 15)}...`;
    const hashedKey = crypto.createHash('sha256').update(secretKey).digest('hex');

    try {
      const [inserted] = await db
        .insert(apiKeys)
        .values({
          organizationId,
          name,
          keyPrefix,
          hashedKey,
        })
        .returning();

      return reply.status(201).send({
        id: inserted.id,
        name: inserted.name,
        keyPrefix: inserted.keyPrefix,
        secretKey, // Returned ONCE upon generation
        createdAt: inserted.createdAt,
      });
    } catch {
      const newKey = {
        id: `key_${Date.now()}`,
        organizationId,
        name,
        keyPrefix,
        hashedKey,
        createdAt: new Date(),
        lastUsedAt: null,
      };
      memoryApiKeys.unshift(newKey);

      return reply.status(201).send({
        id: newKey.id,
        name: newKey.name,
        keyPrefix: newKey.keyPrefix,
        secretKey,
        createdAt: newKey.createdAt,
      });
    }
  });

  // Revoke/Delete API key
  fastify.delete('/api/v1/api-keys/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await db.delete(apiKeys).where(eq(apiKeys.id, id));
    } catch {
      const idx = memoryApiKeys.findIndex((k) => k.id === id);
      if (idx !== -1) {
        memoryApiKeys.splice(idx, 1);
      }
    }

    return reply.status(200).send({ success: true, message: 'API key revoked successfully' });
  });
};
