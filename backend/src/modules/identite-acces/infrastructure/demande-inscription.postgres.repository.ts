import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandeInscription } from '../domaine/demande-inscription';
import { DemandeInscriptionRepositoryPort } from '../domaine/demande-inscription.repository.port';
import { DemandeInscriptionOrmEntity } from './demande-inscription.orm-entity';

@Injectable()
export class DemandeInscriptionPostgresRepository implements DemandeInscriptionRepositoryPort {
  constructor(
    @InjectRepository(DemandeInscriptionOrmEntity)
    private readonly repository: Repository<DemandeInscriptionOrmEntity>,
  ) {}

  async sauvegarder(demande: DemandeInscription): Promise<DemandeInscription> {
    const ligne = await this.repository.save({
      id: demande.id,
      nom: demande.nom,
      prenom: demande.prenom,
      age: demande.age,
      pays: demande.pays,
      telephone: demande.telephone,
      codeParrain: demande.codeParrain ?? null,
      niveauSouhaiteCode: demande.niveauSouhaiteCode,
      statut: demande.statut,
      utilisateurId: demande.utilisateurId ?? null,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<DemandeInscription | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverEnAttenteParTelephone(telephone: string): Promise<DemandeInscription | null> {
    const ligne = await this.repository.findOne({ where: { telephone, statut: 'en_attente' } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerEnAttente(): Promise<DemandeInscription[]> {
    const lignes = await this.repository.find({ where: { statut: 'en_attente' }, order: { creeLe: 'ASC' } });
    return lignes.map((ligne) => this.versDomaine(ligne));
  }

  private versDomaine(ligne: DemandeInscriptionOrmEntity): DemandeInscription {
    return DemandeInscription.depuisPersistance({
      id: ligne.id,
      nom: ligne.nom,
      prenom: ligne.prenom,
      age: ligne.age,
      pays: ligne.pays,
      telephone: ligne.telephone,
      codeParrain: ligne.codeParrain ?? undefined,
      niveauSouhaiteCode: ligne.niveauSouhaiteCode,
      statut: ligne.statut,
      utilisateurId: ligne.utilisateurId ?? undefined,
    });
  }
}
