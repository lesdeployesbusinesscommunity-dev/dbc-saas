import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../domaine/utilisateur';
import { UtilisateurRepositoryPort } from '../domaine/utilisateur.repository.port';
import { UtilisateurOrmEntity } from './utilisateur.orm-entity';

@Injectable()
export class UtilisateurPostgresRepository implements UtilisateurRepositoryPort {
  constructor(
    @InjectRepository(UtilisateurOrmEntity)
    private readonly repository: Repository<UtilisateurOrmEntity>,
  ) {}

  async sauvegarder(utilisateur: Utilisateur): Promise<Utilisateur> {
    const ligne = await this.repository.save({
      id: utilisateur.id,
      telephone: utilisateur.telephone,
      email: utilisateur.email ?? null,
      motDePasseHache: utilisateur.motDePasseHache,
      statut: utilisateur.statut,
    });
    return this.versDomaine(ligne);
  }

  async trouverParTelephone(telephone: string): Promise<Utilisateur | null> {
    const ligne = await this.repository.findOne({ where: { telephone } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: UtilisateurOrmEntity): Utilisateur {
    return Utilisateur.depuisPersistance({
      id: ligne.id,
      telephone: ligne.telephone,
      email: ligne.email ?? undefined,
      motDePasseHache: ligne.motDePasseHache,
      statut: ligne.statut,
    });
  }
}
