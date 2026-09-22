import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalAudit } from '../domaine/journal-audit';
import { JournalAuditRepositoryPort } from '../domaine/journal-audit.repository.port';
import { JournalAuditOrmEntity } from './journal-audit.orm-entity';

@Injectable()
export class JournalAuditPostgresRepository implements JournalAuditRepositoryPort {
  constructor(
    @InjectRepository(JournalAuditOrmEntity)
    private readonly repository: Repository<JournalAuditOrmEntity>,
  ) {}

  async enregistrer(entree: JournalAudit): Promise<JournalAudit> {
    const ligne = await this.repository.save({
      action: entree.action,
      typeEntite: entree.typeEntite,
      acteurId: entree.acteurId,
      metadonnees: entree.metadonnees,
    });
    return JournalAudit.depuisPersistance(ligne);
  }

  async lister(limite: number): Promise<JournalAudit[]> {
    const lignes = await this.repository.find({ order: { creeLe: 'DESC' }, take: limite });
    return lignes.map((ligne) => JournalAudit.depuisPersistance(ligne));
  }
}
