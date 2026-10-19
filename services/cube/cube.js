try {
  require('dotenv').config();
} catch {
  // ignore
}

const PostgresDriver = require('@cubejs-backend/postgres-driver');

module.exports = {
  apiSecret: process.env.CUBEJS_API_SECRET || 'dev_cube_secret_token_12345',
  schemaPath: 'schema',

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

  // Query Orchestrator: Single-Flight Deduplication & In-Memory Coalescing
  // When 500 users simultaneously request identical dashboard queries at 9:00 AM,
  // Cube hashes the query AST + tenantId, fires ONLY 1 database query,
  // and streams the result from RAM to the other 499 connections in <10ms.
  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 10,
      queueOptions: {
        concurrency: 8, // Max parallel queries sent to customer DB per tenant
        continueWaitTimeout: 5, // Wait interval for inflight deduplicated queries
        executionTimeout: 60, // Prevent runaway queries from locking database
      },
    },
  },

  preAggregationsSchema: ({ securityContext }) => {
    const tenantId = (securityContext && securityContext.tenantId) || 'default';
    return `pre_aggr_${tenantId}`;
  },
};
