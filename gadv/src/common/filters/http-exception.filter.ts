import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || error;
      }
    } else if ((exception as any).code === 'LIMIT_FILE_SIZE') {
      // Multer file size limit error
      status = HttpStatus.BAD_REQUEST;
      message = 'File too large. Maximum size is 5MB.';
      error = 'Bad Request';
    } else if ((exception as any).code === 'LIMIT_UNEXPECTED_FILE') {
      // Multer unexpected file field error
      status = HttpStatus.BAD_REQUEST;
      message = 'Unexpected file field. Please use the correct field name.';
      error = 'Bad Request';
    } else if ((exception as any).code === 'LIMIT_PART_COUNT') {
      // Multer part count limit error
      status = HttpStatus.BAD_REQUEST;
      message = 'Too many parts in the request.';
      error = 'Bad Request';
    } else if ((exception as any).code === '22003') {
      // PostgreSQL numeric value out of range
      status = HttpStatus.BAD_REQUEST;
      message = 'Une valeur numérique dépasse la limite autorisée';
      error = 'Bad Request';
    } else if ((exception as any).code === '22001') {
      // PostgreSQL string data too long
      status = HttpStatus.BAD_REQUEST;
      message = 'Une valeur de texte est trop longue';
      error = 'Bad Request';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Extract errors object if it exists (from BadRequestException)
    let errors: Record<string, string> = {};
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        errors = (exceptionResponse as any).errors || {};
      }
    }

    console.error('❌ Exception caught:', {
      status,
      message,
      error,
      path: request.url,
      method: request.method,
      exception: exception instanceof Error ? exception.message : String(exception),
      code: (exception as any).code,
      errors,
    });

    const responseBody: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Include errors object if it exists
    if (Object.keys(errors).length > 0) {
      responseBody.errors = errors;
    }

    response.status(status).json(responseBody);
  }
}

