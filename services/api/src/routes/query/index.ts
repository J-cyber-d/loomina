import type { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import type { JWTPayload, CubeQuery } from '@loomina/shared';
import { executeQuerySchema } from './schema.js';

interface QueryRequestBody {
  query: CubeQuery;
}

/**
 * Generate synthetic fallback analytical data when Cube.js daemon is not running in local dev.
 */
function generateSimulatedData(query: CubeQuery, _tenantId: string): Record<string, unknown>[] {
  const hasTimeDimension = query.timeDimensions && query.timeDimensions.length > 0;
  const timeDim = hasTimeDimension ? query.timeDimensions![0] : null;
  const primaryDim = query.dimensions && query.dimensions.length > 0 ? query.dimensions[0] : null;

  const measures = query.measures && query.measures.length > 0 ? query.measures : ['Orders.count'];

  if (timeDim) {
    const dateRangeStr = typeof timeDim.dateRange === 'string' ? timeDim.dateRange : '';
    let points = 7;
    let labelFormat: 'day' | 'month' = 'day';

    if (dateRangeStr.includes('7 days')) {
      points = 7;
      labelFormat = 'day';
    } else if (dateRangeStr.includes('30 days')) {
      points = 30;
      labelFormat = 'day';
    } else if (dateRangeStr.includes('90 days')) {
      points = 12;
      labelFormat = 'day';
    } else if (dateRangeStr.includes('365') || timeDim.granularity === 'month') {
      points = 12;
      labelFormat = 'month';
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const rows: Record<string, unknown>[] = [];

    for (let i = points - 1; i >= 0; i--) {
      let label: string;
      if (labelFormat === 'month') {
        const monthIdx = (now.getMonth() - i + 12) % 12;
        label = months[monthIdx] || `M${12 - i}`;
      } else if (points === 7) {
        label = days[(now.getDay() - i + 7) % 7] || `Day ${7 - i}`;
      } else {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      const row: Record<string, unknown> = {
        [timeDim.dimension]: label,
      };

      for (const m of measures) {
        if (m.toLowerCase().includes('amount') || m.toLowerCase().includes('revenue') || m.toLowerCase().includes('mrr')) {
          const base = 75000 + Math.floor(((points - i) / points) * 45000);
          row[m] = base + Math.floor(Math.random() * 5000);
        } else if (m.toLowerCase().includes('count')) {
          row[m] = Math.floor(150 + Math.random() * 90);
        } else {
          row[m] = Math.floor(50 + Math.random() * 50);
        }
      }

      rows.push(row);
    }
    return rows;
  }

  // Account / Table records
  if (
    primaryDim &&
    (primaryDim.toLowerCase().includes('account') ||
      primaryDim.toLowerCase().includes('customer') ||
      query.dimensions?.some((d) => d.toLowerCase().includes('plan')))
  ) {
    return [
      { id: 'c_01', customer: 'CloudScale Technologies', plan: 'Enterprise', mrr: 14200, health: 'Healthy', activity: '2h ago' },
      { id: 'c_02', customer: 'Fintech Nexus Ltd', plan: 'Enterprise', mrr: 11800, health: 'Healthy', activity: '10m ago' },
      { id: 'c_03', customer: 'DataSphere Media', plan: 'Growth', mrr: 4600, health: 'At Risk', activity: '1d ago' },
      { id: 'c_04', customer: 'OmniAI Platform', plan: 'Growth', mrr: 3900, health: 'Healthy', activity: '4h ago' },
      { id: 'c_05', customer: 'Hyperion Labs', plan: 'Starter', mrr: 950, health: 'Healthy', activity: 'Just now' },
      { id: 'c_06', customer: 'Vortex Analytics', plan: 'Enterprise', mrr: 9800, health: 'Healthy', activity: '15m ago' },
      { id: 'c_07', customer: 'AeroByte Security', plan: 'Growth', mrr: 5200, health: 'Healthy', activity: '3h ago' },
    ];
  }

  // Customer Acquisition Channels
  if (primaryDim && (primaryDim.toLowerCase().includes('channel') || primaryDim.toLowerCase().includes('source'))) {
    const channels = [
      { name: 'Organic Search', count: 420 },
      { name: 'Direct', count: 310 },
      { name: 'Referral', count: 260 },
      { name: 'Partner', count: 190 },
      { name: 'Outreach', count: 140 },
    ];
    return channels.map((c) => ({
      [primaryDim]: c.name,
      [measures[0] || 'Users.count']: c.count,
    }));
  }

  if (primaryDim && primaryDim.includes('status')) {
    const statuses = ['completed', 'processing', 'shipped', 'cancelled'];
    return statuses.map((status) => {
      const row: Record<string, unknown> = {
        [primaryDim]: status,
      };
      for (const m of measures) {
        if (m.toLowerCase().includes('amount')) {
          row[m] = status === 'completed' ? 45200 : status === 'shipped' ? 28300 : 12100;
        } else {
          row[m] = status === 'completed' ? 340 : status === 'shipped' ? 210 : 85;
        }
      }
      return row;
    });
  }

  if (primaryDim) {
    const categories = ['Direct', 'Organic Search', 'Referral', 'Social Media'];
    return categories.map((cat) => {
      const row: Record<string, unknown> = {
        [primaryDim]: cat,
      };
      for (const m of measures) {
        row[m] = Math.floor(100 + Math.random() * 400);
      }
      return row;
    });
  }

  // Single KPI metric row
  const singleRow: Record<string, unknown> = {};
  for (const m of measures) {
    if (m.toLowerCase().includes('mrr') || m.toLowerCase().includes('revenue')) {
      singleRow[m] = 124500;
    } else if (m.toLowerCase().includes('retention')) {
      singleRow[m] = 118;
    } else if (m.toLowerCase().includes('subscription') || m.toLowerCase().includes('count')) {
      singleRow[m] = 1842;
    } else if (m.toLowerCase().includes('amount')) {
      singleRow[m] = 128450;
    } else if (m.toLowerCase().includes('avg')) {
      singleRow[m] = 345.2;
    } else {
      singleRow[m] = 1240;
    }
  }
  return [singleRow];
}

export const queryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: QueryRequestBody }>(
    '/api/v1/query',
    { schema: executeQuerySchema },
    async (request, reply) => {
      const startTime = performance.now();
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        request.log.warn({ reason: 'missing_or_malformed_auth_header' }, 'Unauthorized query: missing token');
        return reply.status(401).send({ error: 'Missing or malformed Authorization header' });
      }

      const token = authHeader.split(' ')[1];
      const embedSecret = process.env.LOOMINA_EMBED_SECRET || 'dev_secret_key_12345';

      let decodedToken: JWTPayload;
      try {
        decodedToken = jwt.verify(token, embedSecret) as JWTPayload;
      } catch (jwtErr) {
        request.log.warn({ reason: 'invalid_or_expired_token', err: (jwtErr as Error).message }, 'Unauthorized query: token rejected');
        return reply.status(401).send({ error: 'Invalid or expired embed token' });
      }

      const { tenantId, organizationId } = decodedToken;
      const { query } = request.body;

      if (!query || typeof query !== 'object') {
        request.log.warn({ tenantId, organizationId }, 'Bad query request: empty or invalid query payload');
        return reply.status(400).send({ error: 'Invalid query payload' });
      }

      request.log.info(
        {
          tenantId,
          organizationId,
          measures: query.measures,
          dimensions: query.dimensions,
          timeDimensions: query.timeDimensions?.map((t) => ({
            dim: t.dimension,
            gran: t.granularity,
            range: t.dateRange,
          })),
        },
        'Executing analytical query'
      );

      const cubeHost = process.env.CUBEJS_URL || 'http://localhost:4001';
      const cubeApiSecret = process.env.CUBEJS_API_SECRET || 'dev_cube_secret_token_12345';

      // Generate a signed Cube JWT encoding the multi-tenant securityContext
      const cubeToken = jwt.sign(
        {
          securityContext: {
            tenantId,
            organizationId,
          },
          exp: Math.floor(Date.now() / 1000) + 300, // 5 min validity
        },
        cubeApiSecret
      );

      try {
        const cubeResponse = await fetch(`${cubeHost}/cubejs-api/v1/load`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: cubeToken,
          },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(3000), // 3s timeout before fallback
        });

        if (cubeResponse.ok) {
          const result = (await cubeResponse.json()) as {
            data: Record<string, unknown>[];
            query?: Record<string, unknown>;
            lastRefreshTime?: string;
          };
          const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

          request.log.info(
            {
              tenantId,
              organizationId,
              executionTimeMs,
              rowsCount: (result.data || []).length,
              isSimulated: false,
            },
            'Analytical query resolved via Cube.js'
          );

          return reply.send({
            data: result.data || [],
            query: result.query || query,
            lastRefreshTime: result.lastRefreshTime || new Date().toISOString(),
            isSimulated: false,
            executionTimeMs,
          });
        }

        // Cube error returned
        const errorText = await cubeResponse.text();
        request.log.warn({ status: cubeResponse.status, errorText }, 'Cube query returned error, using fallback');
      } catch (err: unknown) {
        // Cube service is likely unreachable/offline in local development
        const message = err instanceof Error ? err.message : 'Cube offline';
        request.log.warn({ err: message }, 'Cube.js service unreachable. Returning simulated fallback dataset.');
      }

      // Fallback: Generate simulated analytics dataset
      const simulatedData = generateSimulatedData(query, tenantId);
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

      request.log.info(
        {
          tenantId,
          organizationId,
          executionTimeMs,
          rowsCount: simulatedData.length,
          isSimulated: true,
        },
        'Analytical query resolved via simulated fallback'
      );

      return reply.send({
        data: simulatedData,
        query,
        lastRefreshTime: new Date().toISOString(),
        isSimulated: true,
        executionTimeMs,
      });
    }
  );
};
