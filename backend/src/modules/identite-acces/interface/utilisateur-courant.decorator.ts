import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Utilisateur } from '../domaine/utilisateur';

/** Récupère l'utilisateur attaché à la requête par JwtStrategy (voir JwtAuthGuard). */
export const UtilisateurCourant = createParamDecorator(
  (_donnees: unknown, ctx: ExecutionContext): Utilisateur => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
