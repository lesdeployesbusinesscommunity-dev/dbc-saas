import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'quiz_formation' })
@Unique(['moduleFormationId'])
export class QuizOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_formation_id', type: 'uuid' })
  moduleFormationId: string;

  @Column({ name: 'seuil_reussite', type: 'int' })
  seuilReussite: number;
}
