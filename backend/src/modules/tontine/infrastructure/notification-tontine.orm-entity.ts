import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TYPES_NOTIFICATION_TONTINE, TypeNotificationTontine } from '../domaine/notification-tontine';

@Entity({ name: 'notifications_tontine' })
export class NotificationTontineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'destinataire_membre_id', type: 'uuid' })
  destinataireMembreId: string;

  @Column({ name: 'groupe_id', type: 'uuid' })
  groupeId: string;

  @Column({ type: 'enum', enum: TYPES_NOTIFICATION_TONTINE })
  type: TypeNotificationTontine;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  lue: boolean;

  @Column({ name: 'cree_le', type: 'timestamptz' })
  creeLe: Date;
}
