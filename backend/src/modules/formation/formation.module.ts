import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationController } from './interface/formation.controller';
import { EnregistrerFormationUseCase } from './application/enregistrer-formation.use-case';
import { SupprimerFormationUseCase } from './application/supprimer-formation.use-case';
import { RepondreQuizFormationUseCase } from './application/repondre-quiz-formation.use-case';
import { RecommencerFormationUseCase } from './application/recommencer-formation.use-case';
import { ConsulterCatalogueFormationsUseCase } from './application/consulter-catalogue-formations.use-case';
import { ConsulterMaProgressionFormationUseCase } from './application/consulter-ma-progression-formation.use-case';
import { ProgressionFormationService } from './application/progression-formation.service';
import { AjouterModuleFormationUseCase } from './application/ajouter-module-formation.use-case';
import { AjouterLeconUseCase } from './application/ajouter-lecon.use-case';
import { AjouterQuizUseCase } from './application/ajouter-quiz.use-case';
import { SInscrireFormationUseCase } from './application/sinscrire-formation.use-case';
import { SuivreLeconUseCase } from './application/suivre-lecon.use-case';
import { PasserQuizUseCase } from './application/passer-quiz.use-case';
import { FormationRepositoryPort } from './domaine/formation.repository.port';
import { ModuleFormationRepositoryPort } from './domaine/module-formation.repository.port';
import { LeconRepositoryPort } from './domaine/lecon.repository.port';
import { InscriptionRepositoryPort } from './domaine/inscription.repository.port';
import { ProgressionLeconRepositoryPort } from './domaine/progression-lecon.repository.port';
import { QuizRepositoryPort } from './domaine/quiz.repository.port';
import { QuestionQuizRepositoryPort } from './domaine/question-quiz.repository.port';
import { TentativeQuizRepositoryPort } from './domaine/tentative-quiz.repository.port';
import { CertificatRepositoryPort } from './domaine/certificat.repository.port';
import { GenerateurCertificatPdfPort } from './domaine/generateur-certificat-pdf.port';
import { FormationOrmEntity } from './infrastructure/formation.orm-entity';
import { ModuleFormationOrmEntity } from './infrastructure/module-formation.orm-entity';
import { LeconOrmEntity } from './infrastructure/lecon.orm-entity';
import { InscriptionOrmEntity } from './infrastructure/inscription.orm-entity';
import { ProgressionLeconOrmEntity } from './infrastructure/progression-lecon.orm-entity';
import { QuizOrmEntity } from './infrastructure/quiz.orm-entity';
import { QuestionQuizOrmEntity } from './infrastructure/question-quiz.orm-entity';
import { TentativeQuizOrmEntity } from './infrastructure/tentative-quiz.orm-entity';
import { CertificatOrmEntity } from './infrastructure/certificat.orm-entity';
import { FormationPostgresRepository } from './infrastructure/formation.postgres.repository';
import { ModuleFormationPostgresRepository } from './infrastructure/module-formation.postgres.repository';
import { LeconPostgresRepository } from './infrastructure/lecon.postgres.repository';
import { InscriptionPostgresRepository } from './infrastructure/inscription.postgres.repository';
import { ProgressionLeconPostgresRepository } from './infrastructure/progression-lecon.postgres.repository';
import { QuizPostgresRepository } from './infrastructure/quiz.postgres.repository';
import { QuestionQuizPostgresRepository } from './infrastructure/question-quiz.postgres.repository';
import { TentativeQuizPostgresRepository } from './infrastructure/tentative-quiz.postgres.repository';
import { CertificatPostgresRepository } from './infrastructure/certificat.postgres.repository';
import { GenerateurCertificatPdfKit } from './infrastructure/generateur-certificat-pdfkit';
import { GouvernanceModule } from '../gouvernance/gouvernance.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AdhesionModule } from '../adhesion/adhesion.module';
import { ProgrammesModule } from '../programmes/programmes.module';

/**
 * Module 7 — Formation (LMS). Étendu au-delà du diagramme de classes du
 * Cahier de conception pour se conformer au Cahier des Charges §5.1 : accès
 * conditionnel au niveau DBC (dépend d'Adhésion), quiz de validation par
 * module (score/tentatives/délai), certificat vérifiable, et gain de coins +
 * certificat déclenchés à la validation de la formation entière (tous les
 * quiz réussis), pas au simple visionnage — voir PasserQuizUseCase.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormationOrmEntity,
      ModuleFormationOrmEntity,
      LeconOrmEntity,
      InscriptionOrmEntity,
      ProgressionLeconOrmEntity,
      QuizOrmEntity,
      QuestionQuizOrmEntity,
      TentativeQuizOrmEntity,
      CertificatOrmEntity,
    ]),
    GamificationModule,
    AdhesionModule,
    ProgrammesModule,
    GouvernanceModule,
  ],
  controllers: [FormationController],
  providers: [
    EnregistrerFormationUseCase,
    SupprimerFormationUseCase,
    RepondreQuizFormationUseCase,
    RecommencerFormationUseCase,
    ConsulterCatalogueFormationsUseCase,
    ConsulterMaProgressionFormationUseCase,
    ProgressionFormationService,
    AjouterModuleFormationUseCase,
    AjouterLeconUseCase,
    AjouterQuizUseCase,
    SInscrireFormationUseCase,
    SuivreLeconUseCase,
    PasserQuizUseCase,
    { provide: FormationRepositoryPort, useClass: FormationPostgresRepository },
    { provide: ModuleFormationRepositoryPort, useClass: ModuleFormationPostgresRepository },
    { provide: LeconRepositoryPort, useClass: LeconPostgresRepository },
    { provide: InscriptionRepositoryPort, useClass: InscriptionPostgresRepository },
    { provide: ProgressionLeconRepositoryPort, useClass: ProgressionLeconPostgresRepository },
    { provide: QuizRepositoryPort, useClass: QuizPostgresRepository },
    { provide: QuestionQuizRepositoryPort, useClass: QuestionQuizPostgresRepository },
    { provide: TentativeQuizRepositoryPort, useClass: TentativeQuizPostgresRepository },
    { provide: CertificatRepositoryPort, useClass: CertificatPostgresRepository },
    { provide: GenerateurCertificatPdfPort, useClass: GenerateurCertificatPdfKit },
  ],
  // Exportés pour l'espace admin (formations suivies, dans la fiche de chaque membre).
  exports: [FormationRepositoryPort, InscriptionRepositoryPort],
})
export class FormationModule {}
