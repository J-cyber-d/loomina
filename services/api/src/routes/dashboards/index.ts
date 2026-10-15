import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, dashboards, widgets } from '../../db/index.js';
import { listDashboardsSchema, createDashboardSchema, getDashboardByIdSchema } from './schema.js';

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // List dashboards by organization
  fastify.get('/api/v1/dashboards', { schema: listDashboardsSchema }, async (request) => {
    const { organizationId } = request.query as { organizationId: string };
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
  });

  // Create a new dashboard
  fastify.post('/api/v1/dashboards', { schema: createDashboardSchema }, async (request, reply) => {
    const { organizationId, title, description, theme } = request.body as {
      organizationId: string;
      title: string;
      description?: string;
      theme?: Record<string, unknown>;
    };

    const [newDashboard] = await db
      .insert(dashboards)
      .values({
        organizationId,
        title,
        description,
        theme,
      })
      .returning();

    return reply.status(201).send(newDashboard);
  });

  // Get dashboard by ID with widgets
  fastify.get(
    '/api/v1/dashboards/:id',
    { schema: getDashboardByIdSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [dashboard] = await db.select().from(dashboards).where(eq(dashboards.id, id));

      if (!dashboard) {
        return reply.status(404).send({ error: 'Dashboard not found' });
      }

      const dashboardWidgets = await db.select().from(widgets).where(eq(widgets.dashboardId, id));

      return {
        ...dashboard,
        widgets: dashboardWidgets,
      };
    }
  );
};
