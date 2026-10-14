import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'notifications_lues' })
export class LectureNotificationOrmEntity {
  @PrimaryColumn({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @PrimaryColumn({ type: 'varchar' })
  audience: string;

  @PrimaryColumn({ type: 'varchar' })
  cle: string;

  @CreateDateColumn({ name: 'lue_le', type: 'timestamptz' })
  lueLe: Date;
}
