try {
  require('dotenv').config();
} catch {
  // ignore
}

const PostgresDriver = require('@cubejs-backend/postgres-driver');

module.exports = {
  apiSecret: process.env.CUBEJS_API_SECRET || 'dev_cube_secret_token_12345',

  // Multitenancy scheduled refresh contexts
  scheduledRefreshContexts: async () => [],

  // Dynamically resolve customer analytical database per request
  driverFactory: async ({ securityContext }) => {
    if (securityContext && securityContext.dbUrl) {
      return new PostgresDriver({
        url: securityContext.dbUrl,
      });
    }

    return new PostgresDriver({
      url:
        process.env.CUBEJS_DB_URL ||
        'postgres://postgres:postgrespassword@localhost:5432/loomina_metadata',
    });
  },

  // Tenant cache isolation: strictly isolates query cache per tenant
  contextToAppId: ({ securityContext }) => {
    const tenantId = (securityContext && securityContext.tenantId) || 'default';
    return `tenant_${tenantId}`;
  },

  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 10,
    },
  },

  preAggregationsSchema: ({ securityContext }) => {
    const tenantId = (securityContext && securityContext.tenantId) || 'default';
    return `pre_aggr_${tenantId}`;
  },
};
