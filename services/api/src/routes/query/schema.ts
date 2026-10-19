export const executeQuerySchema = {
  description:
    'Execute analytical query against Cube.js analytical engine with tenant Row-Level Security (RLS) enforcement',
  tags: ['Query'],
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        description: 'Bearer signed guest JWT token containing tenantId and orgId',
      },
    },
  },
  body: {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'object',
        description: 'Cube.js semantic query object',
        properties: {
          measures: {
            type: 'array',
            items: { type: 'string' },
            example: ['Orders.count', 'Orders.totalAmount'],
          },
          dimensions: {
            type: 'array',
            items: { type: 'string' },
            example: ['Orders.status'],
          },
          timeDimensions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dimension: { type: 'string' },
                granularity: {
                  type: 'string',
                  enum: ['day', 'week', 'month', 'quarter', 'year'],
                },
                dateRange: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } },
                  ],
                },
              },
            },
          },
          filters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                member: { type: 'string' },
                operator: { type: 'string' },
                values: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          limit: { type: 'integer', example: 100 },
          offset: { type: 'integer', example: 0 },
          order: { type: 'object' },
        },
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
        query: { type: 'object', additionalProperties: true },
        lastRefreshTime: { type: 'string', nullable: true },
        isSimulated: { type: 'boolean' },
        executionTimeMs: { type: 'number' },
      },
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
    },
  },
};
