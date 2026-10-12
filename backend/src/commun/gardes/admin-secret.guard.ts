import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';

/**
 * Garde des endpoints admin. Deux façons d'y passer :
 *  - un jeton d'accès (Authorization: Bearer ...) dont le rôle est "admin" :
 *    c'est le cas du back-office, où l'admin se connecte comme tout membre
 *    (voir ConnecterUtilisateurUseCase et ADMIN_TELEPHONES) ;
 *  - le secret partagé x-admin-secret, conservé pour les outils internes
 *    (collections Postman, scripts) — à retirer avant la mise en production.
 *
 * Le jeton est vérifié ici sans passer par Passport pour que tous les modules
 * puissent utiliser ce garde sans importer Identité & accès.
 */
@Injectable()
export class AdminSecretGuard implements CanActivate {
  private readonly jwt: JwtService;

  constructor(private readonly config: ConfigService) {
    this.jwt = new JwtService({ secret: this.config.get<string>('jwt.secret') });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const entete: string | undefined = request.headers['authorization'];
    if (entete?.startsWith('Bearer ')) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string; role?: string }>(entete.slice('Bearer '.length));
        if (payload.role === 'admin') {
          request.adminId = payload.sub;
          return true;
        }
      } catch {
        // jeton invalide ou expiré : on retombe sur le secret, puis sur le refus
      }
    }

    const recu: string | undefined = request.headers['x-admin-secret'];
    const attendu = this.config.get<string>('admin.secret')!;
    if (recu && this.sontEgaux(recu, attendu)) {
      return true;
    }

    throw new UnauthorizedException('Accès réservé aux administrateurs');
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
