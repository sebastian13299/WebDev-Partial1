import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SqliteModule } from './sqlite/sqlite.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    SqliteModule.forRoot(),
    UsersModule,
    PaymentsModule,
    ReportsModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
