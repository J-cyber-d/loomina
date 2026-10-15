export const createEmbedTokenSchema = {
  description:
    'Generate a cryptographically signed HMAC-SHA256 guest JWT for embedding a dashboard into a customer SaaS application.',
  tags: ['Embed'],
  body: {
    type: 'object',
    required: ['organizationId', 'tenantId'],
    properties: {
      organizationId: {
        type: 'string',
        format: 'uuid',
        description: 'The Loomina organization UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
      tenantId: {
        type: 'string',
        description:
          'The customer tenant / organization identifier in your SaaS (used for Row-Level Security)',
        example: 'tenant_acme_corp',
      },
      allowedDashboards: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        description: 'Optional list of dashboard UUIDs this guest token is permitted to view',
        example: ['770e8400-e29b-41d4-a716-446655440001'],
      },
      filters: {
        type: 'object',
        description:
          'Optional key-value filters to strictly enforce on queries at the semantic layer',
        example: { department: 'Engineering', country: 'US' },
      },
      expiresInHours: {
        type: 'number',
        default: 24,
        description: 'Token validity period in hours',
        example: 24,
      },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Signed JWT string to pass to <EmbeddedDashboard token={token} />',
        },
        expiresAt: { type: 'string', format: 'date-time' },
        tenantId: { type: 'string' },
      },
    },
  },
};

export const verifyEmbedTokenSchema = {
  description:
    'Sub-millisecond (<0.2ms) stateless verification of an embedded guest JWT. Verifies signature in server RAM with ZERO database roundtrips.',
  tags: ['Embed'],
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        tenantId: { type: 'string', example: 'tenant_acme_corp' },
        orgId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        expiresAt: { type: 'string' },
      },
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Invalid or expired token' },
      },
    },
  },
};
