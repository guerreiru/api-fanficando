import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    let message = "";
    if (typeof errorResponse === "string") {
      message = errorResponse;
    } else if ((errorResponse as any).message) {
      message = Array.isArray((errorResponse as any).message)
        ? (errorResponse as any).message.join("; ")
        : (errorResponse as any).message;
    } else {
      message = (errorResponse as any).error || "Erro desconhecido";
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
