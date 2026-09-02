import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Vérifie que l'appelant du webhook connaît le secret partagé avec le fournisseur
 * Mobile Money — voir "Signature valide ?" dans le diagramme d'activité du cahier
 * de conception, module Paiements. Comparaison en temps constant pour ne pas
 * fuiter d'information via le timing de la réponse.
 */
@Injectable()
export class WebhookSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const recu: string | undefined = request.headers['x-webhook-secret'];
    const attendu = this.config.get<string>('paiements.webhookSecret')!;

    if (!recu || !this.sontEgaux(recu, attendu)) {
      throw new UnauthorizedException('Signature de webhook invalide');
    }
    return true;
  }

  private sontEgaux(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
