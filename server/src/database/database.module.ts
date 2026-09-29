import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from 'src/config/configuration';

/**
 * Database connection.
 *
 * `synchronize` is hard-coded `false` rather than read from configuration.
 * Making it configurable is how a staging flag eventually reaches production
 * and rewrites a live schema on boot; the only safe value in a deployed
 * environment is the one that cannot be changed by an environment variable
 * (section 3). Local schema iteration goes through `migration:generate`.
 *
 * `autoLoadEntities` lets each feature module register its own entities via
 * `TypeOrmModule.forFeature`, so this file never grows a list that couples it
 * to every module in the system.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const db = configService.get('database', { infer: true });
        const isProduction = configService.get('isProduction', { infer: true });

        return {
          type: 'postgres' as const,
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.name,
          schema: db.schema,
          ssl: db.ssl ? { rejectUnauthorized: false } : false,

          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,

          // 'all' is a development affordance only; it prints parameter values.
          logging:
            db.logging === 'all'
              ? ('all' as const)
              : db.logging === 'none'
                ? false
                : (['error', 'warn'] as const),
          maxQueryExecutionTime: db.slowQueryMs,

          // Retry on boot so the API survives Postgres coming up a moment
          // later than the container — common in compose and in Kubernetes.
          retryAttempts: isProduction ? 10 : 3,
          retryDelay: 3000,

          extra: {
            max: db.poolMax,
            min: db.poolMin,
            connectionTimeoutMillis: db.connectionTimeoutMs,
            idleTimeoutMillis: db.idleTimeoutMs,
            statement_timeout: db.statementTimeoutMs,
            application_name: 'acquisition-portal-api',
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
