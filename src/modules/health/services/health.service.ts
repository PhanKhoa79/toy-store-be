import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'toyshop-be',
      timestamp: new Date().toISOString()
    };
  }
}
