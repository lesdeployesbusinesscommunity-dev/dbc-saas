import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Uniformise toutes les erreurs au format RFC 7807 (application/problem+json),
 * comme spécifié dans le cahier de conception — section "Contrats API".
 */
@Catch()
export class FiltreExceptionsGlobal implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const messageBrut =
      exception instanceof HttpException ? exception.getResponse() : 'Erreur interne';

    const detail =
      typeof messageBrut === 'string'
        ? messageBrut
        : (messageBrut as any).message?.toString() ?? JSON.stringify(messageBrut);

    response.status(status).type('application/problem+json').json({
      type: `urn:dbc:error:${status}`,
      title: HttpStatus[status] ?? 'Erreur',
      status,
      detail,
      instance: request.url,
    });
  }
}
