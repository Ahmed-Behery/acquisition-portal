import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { configuration } from 'src/config/configuration';

/**
 * Standalone DataSource for the TypeORM CLI (migrations, seeds).
 *
 * The CLI runs outside the Nest container, so it cannot use ConfigService —
 * but it must not diverge from the runtime configuration either. Both read the
 * same `configuration()` factory, so there is exactly one description of how
 * to reach the database.
 *
 * `synchronize` is absent here and hard-coded `false` in the module: schema
 * changes go through migrations, never through application startup (section 3).
 */
loadEnv();

const appConfig = configuration();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: appConfig.database.host,
  port: appConfig.database.port,
  username: appConfig.database.username,
  password: appConfig.database.password,
  database: appConfig.database.name,
  schema: appConfig.database.schema,
  ssl: appConfig.database.ssl ? { rejectUnauthorized: false } : false,

  // Compiled JS in production, TS under ts-node locally — resolved from this
  // file's own directory so the CLI and the running app agree.
  entities: [__dirname + '/../modules/**/entities/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',

  synchronize: false,
  migrationsRun: false,
  logging: appConfig.database.logging === 'all' ? 'all' : ['error', 'warn', 'migration'],
  maxQueryExecutionTime: appConfig.database.slowQueryMs,

  extra: {
    max: appConfig.database.poolMax,
    min: appConfig.database.poolMin,
    connectionTimeoutMillis: appConfig.database.connectionTimeoutMs,
    idleTimeoutMillis: appConfig.database.idleTimeoutMs,
    // Server-side ceiling on any single query. Without it one pathological
    // query can hold a pool connection indefinitely.
    statement_timeout: appConfig.database.statementTimeoutMs,
    application_name: 'acquisition-portal-api',
  },
};

/** Default export is required by `typeorm-ts-node-commonjs -d`. */
export default new DataSource(dataSourceOptions);
