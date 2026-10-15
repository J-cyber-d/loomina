export const listDashboardsSchema = {
  description: 'Retrieve all dashboards for a specific organization',
  tags: ['Dashboards'],
  querystring: {
    type: 'object',
    required: ['organizationId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid', description: 'Organization UUID' },
    },
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          isPublished: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  },
};

export const createDashboardSchema = {
  description: 'Create a new dashboard configuration canvas',
  tags: ['Dashboards'],
  body: {
    type: 'object',
    required: ['organizationId', 'title'],
    properties: {
      organizationId: { type: 'string', format: 'uuid', description: 'Organization UUID' },
      title: { type: 'string', example: 'Executive Revenue Dashboard' },
      description: { type: 'string', example: 'Customer-facing MRR, Churn and LTV metrics' },
      theme: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['dark', 'light'], default: 'dark' },
          fontFamily: { type: 'string', default: 'Inter, sans-serif' },
          radius: { type: 'string', default: '0.75rem' },
        },
      },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        createdAt: { type: 'string' },
      },
    },
  },
};

export const getDashboardByIdSchema = {
  description:
    'Fetch complete dashboard layout JSON including all widget cards and query configurations',
  tags: ['Dashboards'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Dashboard UUID' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        organizationId: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        theme: { type: 'object', nullable: true },
        widgets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              type: { type: 'string' },
              query: { type: 'object' },
              layout: { type: 'object' },
              actions: { type: 'array', nullable: true },
            },
          },
        },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Dashboard not found' },
      },
    },
  },
};
