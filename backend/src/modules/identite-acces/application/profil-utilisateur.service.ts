import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Utilisateur } from '../domaine/utilisateur';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface ProfilUtilisateur {
  id: string;
  phoneNumber: string;
  email: string | null;
  status: string;
  role: string;
  membershipNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  city: string | null;
  profession: string | null;
  photoUrl: string | null;
  level: { id: number; code: string; name: string } | null;
  joinedAt: Date | null;
}

/** Contenu du jeton d'accès — voir JwtStrategy et AdminSecretGuard. */
export interface PayloadJwt {
  sub: string;
  telephone: string;
  role: string;
}

/**
 * Profil renvoyé à la connexion et par GET /auth/me : il réunit ce que
 * l'espace membre affiche partout (nom, matricule, niveau, rôle). Le profil
 * (nom, ville, profession, photo) et le niveau viennent du Membre (Adhésion),
 * le téléphone, l'e-mail et le rôle du compte.
 */
@Injectable()
export class ProfilUtilisateurService {
  constructor(
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly jwt: JwtService,
  ) {}

  async construire(utilisateur: Utilisateur): Promise<ProfilUtilisateur> {
    const membre = await this.membres.trouverParId(utilisateur.id!);
    const niveau = membre ? await this.niveaux.trouverParId(membre.niveauActuelId) : null;

    return {
      id: utilisateur.id!,
      phoneNumber: utilisateur.telephone,
      email: utilisateur.email ?? null,
      status: utilisateur.statut,
      role: utilisateur.role,
      membershipNumber: membre?.matricule ?? null,
      firstName: membre?.profil.prenom ?? null,
      lastName: membre?.profil.nom ?? null,
      country: membre?.profil.pays ?? null,
      city: membre?.profil.ville ?? null,
      profession: membre?.profil.profession ?? null,
      photoUrl: membre?.profil.photoUrl ?? null,
      level: niveau ? { id: niveau.id, code: niveau.code, name: niveau.nom } : null,
      joinedAt: membre?.creeLe ?? null,
    };
  }

  emettreJeton(utilisateur: Utilisateur): Promise<string> {
    const payload: PayloadJwt = { sub: utilisateur.id!, telephone: utilisateur.telephone, role: utilisateur.role };
    return this.jwt.signAsync(payload);
  }
}
