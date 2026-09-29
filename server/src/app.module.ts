import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { configuration, type AppConfig } from './config/configuration';
import { validationSchema } from './config/validation';
import { REQUEST_ID_HEADER, SENSITIVE_FIELDS } from './config/constants';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PasswordChangeGuard } from './common/guards/password-change.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { HealthModule } from './modules/health/health.module';
import { PasswordModule } from './modules/password/password.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    /* ----------------------------------------------------- configuration */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        // Report every problem at once rather than one per restart.
        abortEarly: false,
        // Refuse unrecognised variables: a typo'd name would otherwise fall
        // back to a default and be silently ignored.
        allowUnknown: true,
      },
      // .env is for local development only; deployed environments inject real
      // environment variables from the secret store.
      envFilePath: ['.env'],
      cache: true,
    }),

    /* ------------------------------------------------------------ logging */
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const log = configService.get('log', { infer: true });

        return {
          pinoHttp: {
            level: log.level,

            // Correlation id shared with RequestContextMiddleware, so a log
            // line and the `requestId` in an error response match.
            genReqId: (req: IncomingMessage, res: ServerResponse) => {
              const existing = (req as IncomingMessage & { id?: string }).id;
              const id = existing ?? randomUUID();
              res.setHeader(REQUEST_ID_HEADER, id);
              return id;
            },

            // Redaction is the difference between useful logs and a secondary
            // credential store. Covers bodies, headers and nested payloads.
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                ...SENSITIVE_FIELDS.flatMap((field) => [
                  `req.body.${field}`,
                  `body.${field}`,
                  `*.${field}`,
                ]),
              ],
              censor: '[redacted]',
            },

            // Trim the request/response objects to what is diagnostically
            // useful; the defaults serialise far more than anyone reads.
            serializers: {
              req: (req: IncomingMessage & { id?: string; method?: string; url?: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
            },

            // A 4xx is the caller's mistake, not the server's — logging it at
            // error level makes real errors impossible to find.
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },

            // Health probes fire every few seconds and would drown the log.
            autoLogging: {
              ignore: (req: IncomingMessage) => (req.url ?? '').includes('/health/'),
            },

            // NDJSON in production so the log shipper can parse it; pretty
            // output only for a human at a terminal.
            transport: log.pretty
              ? {
                  target: 'pino-pretty',
                  options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
                }
              : undefined,
          },
        };
      },
    }),

    /* ------------------------------------------------------ rate limiting */
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const throttle = configService.get('throttle', { infer: true });

        // Two named buckets. Routes opt into 'auth' with @Throttle; everything
        // else falls under 'default'. In-memory storage is correct for a
        // single instance — behind more than one, point this at Redis via
        // ThrottlerStorageRedisService or the limit multiplies by instance count.
        return {
          throttlers: [
            { name: 'default', ttl: throttle.ttlSeconds * 1000, limit: throttle.limit },
            { name: 'auth', ttl: throttle.authTtlSeconds * 1000, limit: throttle.authLimit },
          ],
        };
      },
    }),

    /* ------------------------------------------------------------- domain */
    DatabaseModule,
    PasswordModule,
    CompaniesModule,
    UsersModule,
    AuthModule,
    HealthModule,
  ],

  providers: [
    /*
     * Guard order is registration order, and it is load-bearing:
     *
     *   1. Throttler       — reject floods before doing any work;
     *   2. JwtAuthGuard    — establish the principal (default-deny);
     *   3. RolesGuard      — check the role (needs the principal);
     *   4. PasswordChange  — confine accounts on a temporary credential.
     */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PasswordChangeGuard },

    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
