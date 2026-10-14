import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AudienceNotification,
  LectureNotificationRepositoryPort,
} from '../domaine/lecture-notification.repository.port';
import { LectureNotificationOrmEntity } from './lecture-notification.orm-entity';

@Injectable()
export class LectureNotificationPostgresRepository implements LectureNotificationRepositoryPort {
  constructor(
    @InjectRepository(LectureNotificationOrmEntity)
    private readonly repository: Repository<LectureNotificationOrmEntity>,
  ) {}

  async listerCles(utilisateurId: string, audience: AudienceNotification): Promise<string[]> {
    const lignes = await this.repository.find({ where: { utilisateurId, audience } });
    return lignes.map((ligne) => ligne.cle);
  }

  async ajouter(utilisateurId: string, audience: AudienceNotification, cles: string[]): Promise<void> {
    if (cles.length === 0) return;
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(cles.map((cle) => ({ utilisateurId, audience, cle })))
      .orIgnore()
      .execute();
  }
}
