cube('Orders', {
  sql: 'SELECT * FROM sample_orders WHERE tenant_id = COMPILE_CONTEXT.securityContext.tenantId',

  // Cube In-Memory Cache Invalidation: refreshes cache every 10 minutes or on new data
  refreshKey: {
    every: '10 minute',
  },

  // Pre-aggregations: Rollup tables built automatically in tenant-isolated schema
  preAggregations: {
    mainSummary: {
      measures: [CUBE.count, CUBE.totalAmount],
      dimensions: [CUBE.status],
      timeDimension: CUBE.createdAt,
      granularity: 'day',
    },
  },

  measures: {
    count: {
      type: 'count',
    },
    totalAmount: {
      sql: 'amount',
      type: 'sum',
    },
    avgAmount: {
      sql: 'amount',
      type: 'avg',
    },
  },

  dimensions: {
    id: {
      sql: 'id',
      type: 'string',
      primaryKey: true,
    },
    status: {
      sql: 'status',
      type: 'string',
    },
    paymentMethod: {
      sql: 'payment_method',
      type: 'string',
    },
    createdAt: {
      sql: 'created_at',
      type: 'time',
    },
  },
});
