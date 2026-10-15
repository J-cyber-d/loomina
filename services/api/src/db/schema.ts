import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

// Multi-tenant organization workspaces
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Developer accounts
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Developer Secret Keys (lm_live_...) for server-side JWT signing
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
  hashedKey: text('hashed_key').notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Dashboards
export const dashboards = pgTable('dashboards', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  theme: jsonb('theme'),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Dashboard Widgets
export const widgets = pgTable('widgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  dashboardId: uuid('dashboard_id')
    .references(() => dashboards.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  query: jsonb('query').notNull(),
  layout: jsonb('layout').notNull(),
  actions: jsonb('actions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Connected Customer Analytical Databases (Encrypted)
export const dataSources = pgTable('data_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  tenantId: varchar('tenant_id', { length: 255 }), // null = shared database; not null = database-per-tenant
  engineType: varchar('engine_type', { length: 50 }).notNull(), // postgres | clickhouse | mysql
  encryptedConnectionUri: text('encrypted_connection_uri').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
