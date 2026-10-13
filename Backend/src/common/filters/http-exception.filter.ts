import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    let status = 500;
    let message: string | string[] = 'Internal server error';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const body = error.getResponse();
      message = typeof body === 'string' ? body : (body as { message?: string | string[] }).message ?? error.message;
    } else if (error instanceof MongoServerError) {
      if (error.code === 11000) { status = 409; message = 'Resource already exists'; }
      if (error.code === 121) { status = 400; message = 'Invalid resource data'; }
    } else if (error && typeof error === 'object' && 'type' in error) {
      if (error.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }
      if (error.type === 'entity.too.large') { status = 413; message = 'Request body too large'; }
    }
    if (status >= 500) this.logger.error({ requestId: request.id, errorType: error instanceof Error ? error.name : 'UnknownError' }, 'Request failed');
    response.status(status).json({ statusCode: status, message, requestId: request.id, timestamp: new Date().toISOString() });
  }
}
