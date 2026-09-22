import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'messages_contact' })
export class MessageContactOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  telephone: string | null;

  @Column({ type: 'varchar' })
  sujet: string;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;
}
