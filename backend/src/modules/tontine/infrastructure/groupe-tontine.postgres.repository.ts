import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { GroupeTontineOrmEntity } from './groupe-tontine.orm-entity';

@Injectable()
export class GroupeTontinePostgresRepository implements GroupeTontineRepositoryPort {
  constructor(
    @InjectRepository(GroupeTontineOrmEntity)
    private readonly repository: Repository<GroupeTontineOrmEntity>,
  ) {}

  async sauvegarder(groupe: GroupeTontine): Promise<GroupeTontine> {
    const ligne = await this.repository.save({
      id: groupe.id,
      niveauId: groupe.niveauId,
      numero: groupe.numero,
      cotisationMensuelle: groupe.cotisationMensuelle,
      montantCagnotte: groupe.montantCagnotte,
      responsableMembreId: groupe.responsableMembreId,
      statut: groupe.statut,
      creeLe: groupe.creeLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<GroupeTontine | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async lister(niveauId?: number): Promise<GroupeTontine[]> {
    const lignes = await this.repository.find({
      where: niveauId === undefined ? {} : { niveauId },
      order: { creeLe: 'DESC' },
    });
    return lignes.map((l) => this.versDomaine(l));
  }

  async listerParResponsable(membreId: string): Promise<GroupeTontine[]> {
    const lignes = await this.repository.find({ where: { responsableMembreId: membreId }, order: { creeLe: 'DESC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  compterParNiveau(niveauId: number): Promise<number> {
    return this.repository.count({ where: { niveauId } });
  }

  private versDomaine(ligne: GroupeTontineOrmEntity): GroupeTontine {
    return GroupeTontine.depuisPersistance({
      id: ligne.id,
      niveauId: ligne.niveauId,
      numero: ligne.numero,
      // pg renvoie les colonnes numeric en string pour ne pas perdre de précision.
      cotisationMensuelle: Number(ligne.cotisationMensuelle),
      montantCagnotte: Number(ligne.montantCagnotte),
      responsableMembreId: ligne.responsableMembreId,
      statut: ligne.statut,
      creeLe: ligne.creeLe,
    });
  }
}
