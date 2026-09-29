import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger as NestLogger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Buffer startup logs until pino is available, so boot messages land in
    // the same structured stream as everything else.
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));
  const logger = new NestLogger('Bootstrap');
  const configService = app.get(ConfigService<AppConfig, true>);

  const port = configService.get('port', { infer: true });
  const apiPrefix = configService.get('apiPrefix', { infer: true });
  const isProduction = configService.get('isProduction', { infer: true });
  const http = configService.get('http', { infer: true });
  const cookie = configService.get('cookie', { infer: true });
  const swagger = configService.get('swagger', { infer: true });

  /* ------------------------------------------------------------- routing */

  app.setGlobalPrefix(apiPrefix, {
    // Probes stay at /health/* so an orchestrator's configuration does not
    // change when the API prefix does.
    exclude: ['health/live', 'health/ready'],
  });

  // URI versioning: /api/v1/users. Explicit in the URL, so a breaking change
  // ships as v2 alongside v1 instead of breaking live clients.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  /* ------------------------------------------------------------ security */

  // Only trust X-Forwarded-For when actually behind a proxy. Enabling it
  // unconditionally lets any client spoof its IP and defeat rate limiting.
  if (http.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        // This is a JSON API: it serves no HTML and should execute nothing.
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      // 1 year, preload-eligible. Harmless over plain HTTP locally because
      // browsers ignore HSTS on non-secure origins.
      hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // Advertising the framework and version only helps someone matching known CVEs.
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.use(cookieParser(cookie.secret));
  app.use(compression());

  app.enableCors({
    // Explicit origins only. With credentials enabled, a wildcard is both
    // rejected by browsers and a cross-origin credential leak (section 7).
    origin: http.corsOrigins,
    credentials: http.corsCredentials,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86_400,
  });

  /* ---------------------------------------------------------- validation */

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip anything not declared on the DTO. Without it, a client can set
      // properties the DTO never described and they reach the service layer.
      whitelist: true,
      // And reject outright rather than silently dropping, so a client
      // discovers a misspelled field instead of wondering why it was ignored.
      forbidNonWhitelisted: true,
      // Query and path params arrive as strings; @Type() converts them.
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      // Never echo the submitted value back in an error — that is how a
      // password ends up in a log or an error-tracking payload.
      disableErrorMessages: false,
      validationError: { target: false, value: false },
      forbidUnknownValues: true,
    }),
  );

  /* --------------------------------------------------------- body limits */

  const express = app.getHttpAdapter().getInstance() as {
    set: (key: string, value: unknown) => void;
  };
  express.set('query parser', 'simple');
  app.useBodyParser('json', { limit: http.bodyLimit });
  app.useBodyParser('urlencoded', { limit: http.bodyLimit, extended: true });

  /* ---------------------------------------------------------------- docs */

  if (swagger.enabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Contact Group · Corporate Acquisition Portal API')
        .setDescription(
          'Client and pipeline platform for the Contact Group.\n\n' +
            'Every endpoint requires a bearer access token unless marked otherwise. ' +
            'Obtain one from `POST /api/v1/auth/login`; the refresh token is set as an ' +
            'HttpOnly cookie and rotates on each use.',
        )
        .setVersion('1.0')
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
          'bearer',
        )
        .addServer(`/${apiPrefix}`)
        .build(),
    );

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log(`API documentation at /docs`);
  }

  /* ------------------------------------------------------------ lifecycle */

  // Lets Nest close the database pool and finish in-flight requests on
  // SIGTERM, instead of dropping connections when the orchestrator stops the
  // container.
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  logger.log(`API listening on port ${port} (${isProduction ? 'production' : 'development'})`);
  logger.log(`Base path: /${apiPrefix}/v1`);
}

void bootstrap().catch((error: unknown) => {
  // The logger may not exist yet if configuration validation failed, so this
  // one case legitimately uses console.
  console.error('Failed to start the application:', error);
  process.exit(1);
});
