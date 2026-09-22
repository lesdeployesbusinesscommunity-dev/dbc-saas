import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'certificats_formation' })
@Unique(['inscriptionId'])
@Unique(['codeVerification'])
export class CertificatOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inscription_id', type: 'uuid' })
  inscriptionId: string;

  @Column({ name: 'code_verification', type: 'varchar' })
  codeVerification: string;

  @Column({ name: 'delivre_le', type: 'timestamptz' })
  delivreLe: Date;
}
