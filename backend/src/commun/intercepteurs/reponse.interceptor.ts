import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Enveloppe toute réponse de succès au format convenu avec le frontend :
 * { "data": ... }. Les erreurs sont gérées séparément par FiltreExceptionsGlobal.
 * Un StreamableFile (ex. certificat PDF) est laissé tel quel : l'envelopper
 * casserait le flux binaire.
 */
@Injectable()
export class ReponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((donnees) => (donnees instanceof StreamableFile ? donnees : { data: donnees })));
  }
}
