import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, dashboards, widgets } from '../../db/index.js';
import { listDashboardsSchema, createDashboardSchema, getDashboardByIdSchema } from './schema.js';

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // List dashboards by organization
  fastify.get('/api/v1/dashboards', { schema: listDashboardsSchema }, async (request) => {
    const { organizationId } = request.query as { organizationId: string };
    try {
      const result = await db
        .select({
          id: dashboards.id,
          title: dashboards.title,
          description: dashboards.description,
          isPublished: dashboards.isPublished,
          createdAt: dashboards.createdAt,
          updatedAt: dashboards.updatedAt,
        })
        .from(dashboards)
        .where(eq(dashboards.organizationId, organizationId));

      return result;
    } catch (err) {
      request.log.error({ err: (err as Error).message }, 'Failed to query dashboards from metadata store');
      throw new Error('Failed to query dashboards from metadata store');
    }
  });

  // Create a new dashboard
  fastify.post('/api/v1/dashboards', { schema: createDashboardSchema }, async (request, reply) => {
    const { organizationId, title, description, theme } = request.body as {
      organizationId: string;
      title: string;
      description?: string;
      theme?: Record<string, unknown>;
    };

    try {
      const [newDashboard] = await db
        .insert(dashboards)
        .values({
          organizationId,
          title,
          description,
          theme,
        })
        .returning();

      request.log.info({ organizationId, dashboardId: newDashboard.id, title }, 'Dashboard created');
      return reply.status(201).send(newDashboard);
    } catch (err) {
      request.log.error({ err: (err as Error).message }, 'Failed to persist dashboard to database');
      throw new Error('Failed to create dashboard in metadata store');
    }
  });

  // Get dashboard by ID with widgets
  fastify.get(
    '/api/v1/dashboards/:id',
    { schema: getDashboardByIdSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const [dashboard] = await db.select().from(dashboards).where(eq(dashboards.id, id));

        if (!dashboard) {
          request.log.warn({ dashboardId: id }, 'Dashboard query returned 404 Not Found');
          return reply.status(404).send({ error: 'Dashboard not found' });
        }

        const dashboardWidgets = await db.select().from(widgets).where(eq(widgets.dashboardId, id));

        return {
          ...dashboard,
          widgets: dashboardWidgets,
        };
      } catch (err) {
        if ((err as { statusCode?: number }).statusCode === 404) {
          throw err;
        }
        request.log.error({ err: (err as Error).message }, 'Failed to fetch dashboard by ID');
        throw new Error('Failed to fetch dashboard from metadata store');
      }
    }
  );
};
