import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { LOG_ACTIONS, LogsService } from './logs.service';

// Saves a log for every request that reaches any controller
@Injectable()
export class LogsInterceptor implements NestInterceptor {
  constructor(private readonly logsService: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    // Logged before the handler runs, so failed requests are saved too
    if (LOG_ACTIONS.includes(request.method)) {
      this.logsService.create(request.method, request.body);
    }

    return next.handle();
  }
}
