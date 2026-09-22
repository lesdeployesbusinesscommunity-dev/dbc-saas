import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'codes_otp' })
export class CodeOtpOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @Column({ name: 'code_hache', type: 'varchar' })
  codeHache: string;

  @Column({ name: 'expire_le', type: 'timestamptz' })
  expireLe: Date;

  @Column({ type: 'int', default: 0 })
  tentatives: number;

  @Column({ type: 'boolean', default: false })
  consomme: boolean;
}
