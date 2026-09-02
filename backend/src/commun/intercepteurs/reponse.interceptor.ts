import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Enveloppe toute réponse de succès au format convenu avec le frontend :
 * { "data": ... }. Les erreurs sont gérées séparément par FiltreExceptionsGlobal.
 */
@Injectable()
export class ReponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((donnees) => ({ data: donnees })));
  }
}
