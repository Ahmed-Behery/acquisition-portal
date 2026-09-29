import request from 'supertest';
import type { Server } from 'node:http';
import { createTestApp, type TestContext } from './app.factory';

describe('Health (e2e)', () => {
  let context: TestContext;
  let server: Server;

  beforeAll(async () => {
    context = await createTestApp();
    server = context.app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await context.app.close();
  });

  // Probes carry no credentials, so they must sit outside the global
  // default-deny guard.
  it('serves liveness without authentication', async () => {
    const response = await request(server).get('/health/live').expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('serves readiness without authentication', async () => {
    const response = await request(server).get('/health/ready').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.info).toHaveProperty('database');
  });

  // Probe paths are excluded from the global prefix so an orchestrator's
  // configuration survives a change to API_PREFIX.
  it('keeps probes outside the API prefix', async () => {
    await request(server).get('/api/health/live').expect(404);
  });

  it('returns RFC 7807 problem details for an unknown route', async () => {
    const response = await request(server).get('/api/v1/does-not-exist').expect(404);

    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body).toMatchObject({ status: 404, code: 'NOT_FOUND' });
    expect(response.body.requestId).toBeDefined();
  });
});
