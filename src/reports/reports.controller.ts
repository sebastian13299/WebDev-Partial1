import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('payments-per-user')
  paymentsPerUser() {
    return this.reportsService.paymentsPerUser();
  }

  @Get('payments-with-iva')
  paymentsWithIva() {
    return this.reportsService.paymentsWithIva();
  }
}
