import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membre } from '../domaine/membre';
import { MembreRepositoryPort } from '../domaine/membre.repository.port';
import { HistoriqueNiveauMembre } from '../domaine/historique-niveau-membre';
import { MembreOrmEntity } from './membre.orm-entity';
import { HistoriqueNiveauMembreOrmEntity } from './historique-niveau-membre.orm-entity';

@Injectable()
export class MembrePostgresRepository implements MembreRepositoryPort {
  constructor(
    @InjectRepository(MembreOrmEntity)
    private readonly repository: Repository<MembreOrmEntity>,
    @InjectRepository(HistoriqueNiveauMembreOrmEntity)
    private readonly historiqueRepository: Repository<HistoriqueNiveauMembreOrmEntity>,
  ) {}

  async sauvegarder(membre: Membre): Promise<Membre> {
    const ligne = await this.repository.save({
      id: membre.id,
      matricule: membre.matricule,
      statut: membre.statut,
      niveauActuelId: membre.niveauActuelId,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<Membre | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async ajouterHistorique(entree: HistoriqueNiveauMembre): Promise<void> {
    await this.historiqueRepository.save({
      membreId: entree.membreId,
      niveauId: entree.niveauId,
      motif: entree.motif,
      debutLe: entree.debutLe,
      finLe: entree.finLe,
    });
  }

  async prochainNumeroSequenceMatricule(): Promise<number> {
    const resultat = await this.repository.manager.query<{ nextval: string }[]>(
      "SELECT nextval('matricule_sequence')",
    );
    return Number(resultat[0].nextval);
  }

  private versDomaine(ligne: MembreOrmEntity): Membre {
    return Membre.depuisPersistance({
      id: ligne.id,
      matricule: ligne.matricule,
      statut: ligne.statut,
      niveauActuelId: ligne.niveauActuelId,
    });
  }
}
