import { Controller, Get } from '@nestjs/common';
import { HealthService } from '@/modules/health/services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }
}
