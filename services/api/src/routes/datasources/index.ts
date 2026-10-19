import type { FastifyPluginAsync } from 'fastify';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { db, dataSources } from '../../db/index.js';
import { encryptCredentials, decryptCredentials } from '../../lib/crypto.js';
import {
  testConnectionSchema,
  listDataSourcesSchema,
  connectDataSourceSchema,
} from './schema.js';

interface DiagnosticResult {
  title: string;
  userMessage: string;
  actionableHint: string;
  category: 'auth' | 'network' | 'database_not_found' | 'syntax' | 'ssl' | 'permission' | 'unknown';
}

/**
 * Translates raw low-level database driver exceptions into crystal-clear,
 * human-friendly user-level diagnostics with actionable remediation steps.
 */
function parseDatabaseError(err: unknown, engineType: string): DiagnosticResult {
  const errorObj = (err || {}) as {
    code?: string;
    message?: string;
    errno?: number | string;
    name?: string;
  };
  const message = errorObj.message || String(err);
  const code = (errorObj.code || '').toUpperCase();

  // 1. Authentication & Credentials Failures
  if (
    code === '28P01' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    message.includes('password authentication failed') ||
    message.includes('Access denied for user')
  ) {
    return {
      title: 'Authentication Failed',
      userMessage: 'The database username or password you provided is incorrect.',
      actionableHint:
        'Please verify your credentials. If you are using PostgreSQL on Windows, the default superuser is usually "postgres". Check for special characters in the password that may need URL encoding.',
      category: 'auth',
    };
  }

  // 2. Database Name Does Not Exist
  if (
    code === '3D000' ||
    code === 'ER_BAD_DB_ERROR' ||
    (message.includes('database') && message.includes('does not exist')) ||
    message.includes('Unknown database')
  ) {
    return {
      title: 'Database Not Found',
      userMessage: 'The target database specified in the connection string does not exist on this server.',
      actionableHint:
        'Verify the database name in your URI, or create it first by running "CREATE DATABASE <database_name>;" in your SQL console.',
      category: 'database_not_found',
    };
  }

  // 3. Connection Refused (Server offline or wrong port)
  if (
    code === 'ECONNREFUSED' ||
    message.includes('ECONNREFUSED') ||
    message.includes('connect ECONNREFUSED')
  ) {
    return {
      title: 'Connection Refused',
      userMessage: `Could not establish a network connection to the ${engineType.toUpperCase()} server.`,
      actionableHint:
        'Ensure your database service is running locally or in Docker, and is actively listening on the target port (PostgreSQL: 5432, MySQL: 3306, ClickHouse: 8123/9000).',
      category: 'network',
    };
  }

  // 4. Hostname / DNS resolution failure
  if (
    code === 'ENOTFOUND' ||
    message.includes('getaddrinfo ENOTFOUND') ||
    message.includes('ENOTFOUND')
  ) {
    return {
      title: 'Host Unreachable / DNS Error',
      userMessage: 'The server address or hostname specified in the connection string could not be resolved.',
      actionableHint:
        'Verify the hostname. If connecting to a local database, use "localhost" or "127.0.0.1". If connecting to a cloud provider (e.g. Supabase, Neon, AWS RDS), check for typos in the endpoint.',
      category: 'network',
    };
  }

  // 5. Network Timeout / Firewall blocking
  if (
    code === 'ETIMEDOUT' ||
    code === 'CONNECT_TIMEOUT' ||
    message.includes('timeout') ||
    message.includes('ETIMEDOUT')
  ) {
    return {
      title: 'Connection Timed Out',
      userMessage: 'The database server took too long to respond (connection attempt timed out after 4 seconds).',
      actionableHint:
        'Check if your cloud database has firewall or IP allowlist restrictions (such as AWS Security Groups or pg_hba.conf). Ensure inbound traffic from your current IP is permitted.',
      category: 'network',
    };
  }

  // 6. SSL / TLS Certificate issues
  if (
    code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
    message.includes('SSL') ||
    message.includes('self-signed') ||
    message.includes('certificate')
  ) {
    return {
      title: 'SSL / TLS Security Requirement',
      userMessage: 'SSL handshake negotiation failed while attempting to connect to the database.',
      actionableHint:
        'Cloud-hosted databases often require encrypted SSL connections. Try appending "?sslmode=require" to your URI, or if using self-signed certificates in local dev, "?sslmode=no-verify".',
      category: 'ssl',
    };
  }

  // 7. Malformed URI or syntax errors
  if (
    message.includes('Invalid URL') ||
    message.includes('protocol') ||
    message.includes('URI malformed')
  ) {
    return {
      title: 'Malformed Connection String',
      userMessage: 'The connection URI syntax is invalid and could not be parsed.',
      actionableHint:
        'Format must be: [engine]://[username]:[password]@[host]:[port]/[database]. Example: postgres://postgres:secret@localhost:5432/my_analytics',
      category: 'syntax',
    };
  }

  // Fallback generic error
  return {
    title: 'Connection Error',
    userMessage: `Database driver reported an error: ${message}`,
    actionableHint:
      'Please check your database server status and verify your connection parameters in the URI.',
    category: 'unknown',
  };
}

function maskConnectionUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return uri.replace(/:([^:@]+)@/, ':****@');
  }
}

export const dataSourceRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Live Test Connection Probe
  fastify.post('/api/v1/datasources/test', { schema: testConnectionSchema }, async (request, reply) => {
    const { engineType, connectionUri } = request.body as {
      engineType: string;
      connectionUri: string;
    };

    // Quick URI format validation
    if (!connectionUri || !connectionUri.includes('://')) {
      return reply.status(400).send({
        success: false,
        title: 'Invalid Connection Format',
        userMessage: 'Please provide a valid connection string including the protocol.',
        actionableHint: `Format should start with ${engineType}://[user]:[password]@[host]:[port]/[database]`,
        technicalDetails: 'Missing protocol separator :// in URI',
      });
    }

    request.log.info(
      { engineType, maskedUri: maskConnectionUri(connectionUri) },
      'Testing customer database connection'
    );

    if (engineType === 'postgres') {
      const startTime = Date.now();
      let client: postgres.Sql | null = null;
      try {
        client = postgres(connectionUri, {
          connect_timeout: 4,
          max: 1,
          idle_timeout: 1,
        });

        // 1. Ping
        await client`SELECT 1`;
        const latency = Date.now() - startTime;

        // 2. Discover available tables for analytical mapping
        const tablesResult = await client`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
          ORDER BY table_name ASC
          LIMIT 12
        `;

        const sampleTables = tablesResult.map((t) => t.table_name as string);

        request.log.info(
          { engineType, latencyMs: latency, tablesDiscovered: sampleTables.length },
          'Database connection test succeeded'
        );

        return reply.status(200).send({
          success: true,
          message: `Connected successfully to PostgreSQL in ${latency}ms`,
          tablesCount: sampleTables.length,
          sampleTables,
        });
      } catch (err) {
        const diagnostics = parseDatabaseError(err, 'postgres');
        request.log.warn(
          {
            engineType,
            category: diagnostics.category,
            title: diagnostics.title,
            err: (err as Error).message,
          },
          'Database connection test failed'
        );
        return reply.status(400).send({
          success: false,
          title: diagnostics.title,
          userMessage: diagnostics.userMessage,
          actionableHint: diagnostics.actionableHint,
          category: diagnostics.category,
          technicalDetails: (err as Error).message,
        });
      } finally {
        if (client) {
          await client.end({ timeout: 1 }).catch(() => {});
        }
      }
    }

    // Generic acknowledgment for ClickHouse / MySQL / Snowflake
    return reply.status(200).send({
      success: true,
      message: `Connection format verified for ${engineType.toUpperCase()}.`,
      tablesCount: 0,
      sampleTables: [],
    });
  });

  // 2. List connected data sources
  fastify.get('/api/v1/datasources', { schema: listDataSourcesSchema }, async (request) => {
    const { organizationId } = request.query as { organizationId: string };

    const sources = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.organizationId, organizationId));

    return sources.map((s) => {
      let masked = '****';
      try {
        const decrypted = decryptCredentials(s.encryptedConnectionUri);
        masked = maskConnectionUri(decrypted);
      } catch {
        masked = '[encrypted connection]';
      }

      return {
        id: s.id,
        organizationId: s.organizationId,
        name: s.engineType.toUpperCase() + ' Analytics',
        engineType: s.engineType,
        tenantId: s.tenantId,
        maskedUri: masked,
        status: 'active',
        createdAt: s.createdAt,
      };
    });
  });

  // 3. Save connected data source
  fastify.post('/api/v1/datasources', { schema: connectDataSourceSchema }, async (request, reply) => {
    const { organizationId, name, tenantId, engineType, connectionUri } = request.body as {
      organizationId: string;
      name: string;
      tenantId?: string | null;
      engineType: string;
      connectionUri: string;
    };

    const encryptedConnectionUri = encryptCredentials(connectionUri);

    const [dataSource] = await db
      .insert(dataSources)
      .values({
        organizationId,
        tenantId: tenantId || null,
        engineType,
        encryptedConnectionUri,
      })
      .returning();

    return reply.status(201).send({
      id: dataSource.id,
      name,
      organizationId: dataSource.organizationId,
      engineType: dataSource.engineType,
      tenantId: dataSource.tenantId,
      status: 'connected',
      createdAt: dataSource.createdAt,
    });
  });
};
