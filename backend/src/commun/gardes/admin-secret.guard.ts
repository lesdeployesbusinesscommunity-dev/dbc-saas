import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Garde temporaire pour les endpoints admin, en attendant de vrais rôles
 * (cahier de conception, module 1, cas d'utilisation 1.5 "Gérer les rôles" —
 * pas encore implémenté). À REMPLACER par un vrai contrôle de rôle une fois
 * RoleUtilisateur/Role construits ; aucune ligne appelante n'aura besoin de
 * changer, seul ce garde sera remplacé.
 */
@Injectable()
export class AdminSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const recu: string | undefined = request.headers['x-admin-secret'];
    const attendu = this.config.get<string>('admin.secret')!;

    if (!recu || !this.sontEgaux(recu, attendu)) {
      throw new UnauthorizedException('Secret admin invalide');
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
