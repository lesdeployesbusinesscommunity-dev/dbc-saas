import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { PayloadJwt } from '../application/profil-utilisateur.service';

/**
 * Valide le JWT présenté (Authorization: Bearer ...) et reconstruit l'utilisateur
 * courant à partir de son id — attaché à req.user par Passport.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly utilisateurs: UtilisateurRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: PayloadJwt) {
    const utilisateur = await this.utilisateurs.trouverParId(payload.sub);
    // Un compte suspendu après l'émission du jeton perd l'accès immédiatement.
    if (!utilisateur || !utilisateur.verifierAccesAutorise().succes) {
      throw new UnauthorizedException();
    }
    return utilisateur;
  }
}
