import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTontine } from '../domaine/notification-tontine';
import { NotificationTontineRepositoryPort } from '../domaine/notification-tontine.repository.port';
import { NotificationTontineOrmEntity } from './notification-tontine.orm-entity';

@Injectable()
export class NotificationTontinePostgresRepository implements NotificationTontineRepositoryPort {
  constructor(
    @InjectRepository(NotificationTontineOrmEntity)
    private readonly repository: Repository<NotificationTontineOrmEntity>,
  ) {}

  async sauvegarder(notification: NotificationTontine): Promise<NotificationTontine> {
    const ligne = await this.repository.save({
      id: notification.id,
      destinataireMembreId: notification.destinataireMembreId,
      groupeId: notification.groupeId,
      type: notification.type,
      message: notification.message,
      lue: notification.lue,
      creeLe: notification.creeLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<NotificationTontine | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async listerParDestinataire(membreId: string): Promise<NotificationTontine[]> {
    const lignes = await this.repository.find({ where: { destinataireMembreId: membreId }, order: { creeLe: 'DESC' } });
    return lignes.map((l) => this.versDomaine(l));
  }

  private versDomaine(ligne: NotificationTontineOrmEntity): NotificationTontine {
    return NotificationTontine.depuisPersistance({
      id: ligne.id,
      destinataireMembreId: ligne.destinataireMembreId,
      groupeId: ligne.groupeId,
      type: ligne.type,
      message: ligne.message,
      lue: ligne.lue,
      creeLe: ligne.creeLe,
    });
  }
}
