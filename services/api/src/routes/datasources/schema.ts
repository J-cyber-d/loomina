export const testConnectionSchema = {
  description:
    'Test a database connection before saving. Runs a live ping and diagnostic check, returning friendly user-level success or error guidance.',
  tags: ['Data Sources'],
  body: {
    type: 'object',
    required: ['engineType', 'connectionUri'],
    properties: {
      engineType: {
        type: 'string',
        enum: ['postgres', 'clickhouse', 'mysql', 'snowflake'],
        example: 'postgres',
      },
      connectionUri: {
        type: 'string',
        description: 'Database connection URI to test',
        example: 'postgres://postgres:password@localhost:5432/my_database',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Connected successfully to PostgreSQL (latency: 8ms)' },
        tablesCount: { type: 'number', example: 12 },
        sampleTables: {
          type: 'array',
          items: { type: 'string' },
          example: ['orders', 'users', 'transactions'],
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        title: { type: 'string', example: 'Authentication Failed' },
        userMessage: {
          type: 'string',
          example: 'The database username or password you provided is incorrect.',
        },
        category: { type: 'string', example: 'auth' },
        actionableHint: {
          type: 'string',
          example: 'Please verify your credentials in the connection string.',
        },
        technicalDetails: { type: 'string', nullable: true },
      },
    },
  },
};

export const listDataSourcesSchema = {
  description: 'List all connected databases for an organization with masked credentials',
  tags: ['Data Sources'],
  querystring: {
    type: 'object',
    required: ['organizationId'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
    },
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          engineType: { type: 'string' },
          tenantId: { type: 'string', nullable: true },
          maskedUri: { type: 'string', example: 'postgres://postgres:****@localhost:5432/my_database' },
          status: { type: 'string', example: 'active' },
          createdAt: { type: 'string' },
        },
      },
    },
  },
};

export const connectDataSourceSchema = {
  description:
    'Securely save a connected customer database. Credentials are encrypted at rest with AES-256-GCM before storage.',
  tags: ['Data Sources'],
  body: {
    type: 'object',
    required: ['organizationId', 'name', 'engineType', 'connectionUri'],
    properties: {
      organizationId: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Production Read Replica' },
      tenantId: {
        type: 'string',
        nullable: true,
        description: 'Leave null for shared database; specify tenant ID for database-per-tenant isolation',
      },
      engineType: {
        type: 'string',
        enum: ['postgres', 'clickhouse', 'mysql', 'snowflake'],
        example: 'postgres',
      },
      connectionUri: {
        type: 'string',
        description: 'Database connection string to encrypt and store',
        example: 'postgres://user:password@db.customer.com:5432/analytics',
      },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        organizationId: { type: 'string', format: 'uuid' },
        engineType: { type: 'string' },
        tenantId: { type: 'string', nullable: true },
        status: { type: 'string', example: 'connected' },
        createdAt: { type: 'string' },
      },
    },
  },
};
