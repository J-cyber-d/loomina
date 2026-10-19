import type { FastifyPluginAsync } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { auth } from '../../lib/auth.js';
import { db, session, user, organization } from '../../db/index.js';

// In-memory fallback session tracking for local dev without active logins
const memorySessions = [
  {
    id: 'sess_admin_01',
    userId: 'usr_founder_01',
    userName: 'Alex Morgan',
    userEmail: 'alex@loomina.dev',
    userRole: 'superadmin',
    userImage: null,
    ipAddress: '127.0.0.1 (Localhost)',
    userAgent: 'Chrome 131.0.0 / Windows 11',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
    activeOrgName: 'Acme SaaS Corp',
  },
  {
    id: 'sess_dev_02',
    userId: 'usr_sarah_02',
    userName: 'Sarah Chen',
    userEmail: 'sarah.chen@acme.io',
    userRole: 'admin',
    userImage: null,
    ipAddress: '192.168.1.45',
    userAgent: 'Firefox 133.0 / macOS Sonoma',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 3600 * 1000).toISOString(),
    activeOrgName: 'Acme SaaS Corp',
  },
  {
    id: 'sess_analyst_03',
    userId: 'usr_marcus_03',
    userName: 'Marcus Vance',
    userEmail: 'marcus@stripe-analytics.com',
    userRole: 'member',
    userImage: null,
    ipAddress: '10.0.4.12',
    userAgent: 'Edge 131.0 / Windows 11',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    activeOrgName: 'Stripe Analytics',
  },
];

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

  // 1. Admin: List all active login sessions with IP & device telemetry
  fastify.get('/api/v1/auth/admin/sessions', async (request) => {
    try {
      const dbSessions = await db
        .select({
          id: session.id,
          userId: session.userId,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          userImage: user.image,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          activeOrgId: session.activeOrganizationId,
        })
        .from(session)
        .innerJoin(user, eq(session.userId, user.id))
        .orderBy(desc(session.createdAt));

      if (dbSessions.length > 0) {
        return dbSessions.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          activeOrgName: s.activeOrgId ? 'Active Org' : 'Default Org',
        }));
      }

      return memorySessions;
    } catch {
      return memorySessions;
    }
  });

  // 2. Admin: Revoke / Terminate a user session
  fastify.delete('/api/v1/auth/admin/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await db.delete(session).where(eq(session.id, id));
    } catch {
      // In-memory removal
      const idx = memorySessions.findIndex((s) => s.id === id);
      if (idx !== -1) {
        memorySessions.splice(idx, 1);
      }
    }

    request.log.info({ sessionId: id }, 'Admin revoked user login session');
    return reply.status(200).send({ success: true, message: 'Session revoked successfully' });
  });

  // 3. Admin: List all registered users
  fastify.get('/api/v1/auth/admin/users', async () => {
    try {
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          banned: user.banned,
          createdAt: user.createdAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt));

      if (users.length > 0) {
        return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
      }

      return [
        {
          id: 'usr_founder_01',
          name: 'Alex Morgan',
          email: 'alex@loomina.dev',
          role: 'superadmin',
          banned: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'usr_sarah_02',
          name: 'Sarah Chen',
          email: 'sarah.chen@acme.io',
          role: 'admin',
          banned: false,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'usr_marcus_03',
          name: 'Marcus Vance',
          email: 'marcus@stripe-analytics.com',
          role: 'member',
          banned: false,
          createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
      ];
    } catch {
      return [
        {
          id: 'usr_founder_01',
          name: 'Alex Morgan',
          email: 'alex@loomina.dev',
          role: 'superadmin',
          banned: false,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  });
};
