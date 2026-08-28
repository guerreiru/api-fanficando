import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload
      ) {
        response.status(status).json(payload);
        return;
      }

      const message =
        typeof payload === 'string'
          ? payload
          : (payload as { message?: string | string[] }).message;

      response.status(status).json({
        error: Array.isArray(message)
          ? message[0]
          : message || exception.message,
      });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Erro interno do servidor.',
    });
  }
}
