import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'secrets_double_authentification' })
export class SecretDoubleAuthentificationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'utilisateur_id', type: 'uuid', unique: true })
  utilisateurId: string;

  @Column({ type: 'boolean', default: false })
  actif: boolean;
}
