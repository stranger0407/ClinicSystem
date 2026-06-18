import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { clinicId?: string; user?: any }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Build structured log object for cloud logging services
    const logDetails = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      clinicId: request.clinicId || null,
      userId: request.user?.id || null,
      role: request.user?.role || null,
      message: typeof message === 'object' && message !== null ? (message as any).message || JSON.stringify(message) : message,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : null,
    };

    // Output structured JSON log
    console.log(JSON.stringify(logDetails));

    // Send response back to the client
    const clientResponse =
      typeof message === 'object' && message !== null
        ? message
        : { statusCode: status, message };

    response.status(status).json(clientResponse);
  }
}
