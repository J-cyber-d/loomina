cube('Orders', {
  sql: 'SELECT * FROM sample_orders WHERE tenant_id = COMPILE_CONTEXT.securityContext.tenantId',

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
