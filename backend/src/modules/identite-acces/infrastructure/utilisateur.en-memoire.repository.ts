import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';

/**
 * Adaptateur TEMPORAIRE en mémoire — permet de déployer et de faire avancer
 * le frontend dès aujourd'hui, sans attendre l'intégration PostgreSQL.
 *
 * À REMPLACER par un UtilisateurPostgresRepository (TypeORM/Prisma) qui
 * implémente le même port — aucune ligne du domaine ni de l'application
 * n'aura besoin de changer, c'est tout l'intérêt de l'architecture hexagonale.
 *
 * ⚠️ Les données sont perdues à chaque redémarrage du serveur.
 */
@Injectable()
export class UtilisateurEnMemoireRepository implements UtilisateurRepositoryPort {
  private utilisateurs: Utilisateur[] = [];

  async sauvegarder(utilisateur: Utilisateur): Promise<Utilisateur> {
    const avecId = Utilisateur.depuisPersistance({
      id: utilisateur.id ?? randomUUID(),
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      motDePasseHache: utilisateur.motDePasseHache,
      statut: utilisateur.statut,
    });
    this.utilisateurs = this.utilisateurs.filter((u) => u.id !== avecId.id);
    this.utilisateurs.push(avecId);
    return avecId;
  }

  async trouverParTelephone(telephone: string): Promise<Utilisateur | null> {
    return this.utilisateurs.find((u) => u.telephone === telephone) ?? null;
  }
}
