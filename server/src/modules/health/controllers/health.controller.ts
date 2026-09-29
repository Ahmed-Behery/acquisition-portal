import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';

/**
 * Liveness and readiness probes.
 *
 * The distinction matters to an orchestrator and is routinely conflated:
 *
 *  · **liveness** answers "is this process wedged, should it be restarted?"
 *    It must not touch the database. If it did, a brief Postgres outage would
 *    make Kubernetes kill every API pod — turning a recoverable dependency
 *    failure into a full outage with a cold start at the end of it.
 *
 *  · **readiness** answers "can this instance serve traffic right now?" It
 *    does check the database, so an instance that cannot reach it is removed
 *    from the load balancer while staying alive to recover.
 *
 * Both are `@Public()`: a probe has no credentials. They expose only
 * up/down status, never versions, hostnames or connection strings — and they
 * are hidden from the OpenAPI document, which is for API consumers.
 */
@ApiExcludeController()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Public()
  @Get('live')
  @HealthCheck()
  checkLiveness(): Promise<HealthCheckResult> {
    // Heap ceiling only — catches a leaking process, which is the one thing a
    // restart actually fixes.
    return this.health.check([() => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024)]);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.pingCheck('database', { timeout: 3000 })]);
  }
}
