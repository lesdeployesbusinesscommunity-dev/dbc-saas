import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { STATUTS_DEMANDE_INSCRIPTION, StatutDemandeInscription } from '../domaine/demande-inscription';

@Entity({ name: 'demandes_inscription' })
export class DemandeInscriptionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  nom: string;

  @Column({ type: 'varchar' })
  prenom: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ type: 'varchar' })
  pays: string;

  @Column({ type: 'varchar' })
  telephone: string;

  @Column({ name: 'code_parrain', type: 'varchar', nullable: true })
  codeParrain: string | null;

  @Column({ name: 'niveau_souhaite_code', type: 'varchar' })
  niveauSouhaiteCode: string;

  @Column({ type: 'enum', enum: STATUTS_DEMANDE_INSCRIPTION })
  statut: StatutDemandeInscription;

  @Column({ name: 'utilisateur_id', type: 'uuid', nullable: true })
  utilisateurId: string | null;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe: Date;
}
