import { Module } from '@nestjs/common';
import { ReportController } from '@/modules/reports/controllers/report.controller';
import { ReportService } from '@/modules/reports/services/report.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService]
})
export class ReportsModule {}
