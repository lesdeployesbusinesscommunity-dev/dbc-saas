import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Uniformise toutes les erreurs au format d'enveloppe convenu avec le frontend :
 * { "error": { "message": "...", "code": "..." } }.
 */
@Catch()
export class FiltreExceptionsGlobal implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const messageBrut =
      exception instanceof HttpException ? exception.getResponse() : 'Erreur interne';

    const message =
      typeof messageBrut === 'string'
        ? messageBrut
        : (messageBrut as any).message?.toString() ?? JSON.stringify(messageBrut);

    response.status(status).json({
      error: {
        message,
        code: HttpStatus[status] ?? 'INTERNAL_ERROR',
      },
    });
  }
}
