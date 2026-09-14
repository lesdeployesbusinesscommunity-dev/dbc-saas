import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreerFormationUseCase } from '../application/creer-formation.use-case';
import { AjouterModuleFormationUseCase } from '../application/ajouter-module-formation.use-case';
import { AjouterLeconUseCase } from '../application/ajouter-lecon.use-case';
import { AjouterQuizUseCase } from '../application/ajouter-quiz.use-case';
import { SInscrireFormationUseCase } from '../application/sinscrire-formation.use-case';
import { SuivreLeconUseCase } from '../application/suivre-lecon.use-case';
import { PasserQuizUseCase } from '../application/passer-quiz.use-case';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { QuizRepositoryPort } from '../domaine/quiz.repository.port';
import { CertificatRepositoryPort } from '../domaine/certificat.repository.port';
import { GenerateurCertificatPdfPort } from '../domaine/generateur-certificat-pdf.port';
import { CreerFormationDto } from './dto/creer-formation.dto';
import { AjouterModuleFormationDto } from './dto/ajouter-module-formation.dto';
import { AjouterLeconDto } from './dto/ajouter-lecon.dto';
import { AjouterQuizDto } from './dto/ajouter-quiz.dto';
import { PasserQuizDto } from './dto/passer-quiz.dto';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { Formation } from '../domaine/formation';

function versReponseFormation(formation: Formation) {
  return {
    id: formation.id,
    code: formation.code,
    name: formation.titre,
    requiredLevelId: formation.niveauRequisId,
    pillarCode: formation.pilierCode,
  };
}

@ApiTags('formation')
@Controller('formations')
export class FormationController {
  constructor(
    private readonly creerFormation: CreerFormationUseCase,
    private readonly ajouterModule: AjouterModuleFormationUseCase,
    private readonly ajouterLecon: AjouterLeconUseCase,
    private readonly ajouterQuiz: AjouterQuizUseCase,
    private readonly sInscrire: SInscrireFormationUseCase,
    private readonly suivreLecon: SuivreLeconUseCase,
    private readonly passerQuiz: PasserQuizUseCase,
    private readonly formations: FormationRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly progressions: ProgressionLeconRepositoryPort,
    private readonly quizzes: QuizRepositoryPort,
    private readonly certificats: CertificatRepositoryPort,
    private readonly generateurCertificatPdf: GenerateurCertificatPdfPort,
    private readonly config: ConfigService,
    private readonly membres: MembreRepositoryPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister le catalogue des formations' })
  async lister() {
    const toutes = await this.formations.listerToutes();
    return toutes.map(versReponseFormation);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une formation (modules et leçons)' })
  async detail(@Param('id') id: string) {
    const formation = await this.formations.trouverParId(id);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }
    const modules = await this.modules.listerParFormationId(id);
    const modulesAvecLecons = await Promise.all(
      modules.map(async (m) => ({
        id: m.id,
        title: m.titre,
        order: m.ordre,
        hasQuiz: (await this.quizzes.trouverParModuleId(m.id!)) !== null,
        lessons: (await this.lecons.listerParModuleId(m.id!)).map((l) => ({ id: l.id, title: l.titre, videoUrl: l.urlVideo })),
      })),
    );
    return { ...versReponseFormation(formation), modules: modulesAvecLecons };
  }

  @Get('certificats/:code')
  @ApiOperation({ summary: 'Vérifier publiquement un certificat via son code' })
  async verifierCertificat(@Param('code') code: string) {
    const certificat = await this.certificats.trouverParCodeVerification(code);
    if (!certificat) {
      throw new NotFoundException('Certificat introuvable');
    }
    const inscription = await this.inscriptions.trouverParId(certificat.inscriptionId);
    return {
      valid: true,
      membreId: inscription?.membreId ?? null,
      formationId: inscription?.formationId ?? null,
      issuedAt: certificat.delivreLe,
    };
  }

  @Post()
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Créer une formation (admin)' })
  async creer(@Body() dto: CreerFormationDto) {
    const formation = await this.creerFormation.executer({
      code: dto.code,
      titre: dto.titre,
      niveauRequisId: dto.niveauRequisId,
      pilierCode: dto.pilierCode,
    });
    return versReponseFormation(formation);
  }

  @Post(':id/modules')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Ajouter un module à une formation (admin)' })
  async ajouterModuleFormation(@Param('id') formationId: string, @Body() dto: AjouterModuleFormationDto) {
    const module = await this.ajouterModule.executer({ formationId, titre: dto.titre, ordre: dto.ordre });
    return { id: module.id, formationId: module.formationId, title: module.titre, order: module.ordre };
  }

  @Post('modules/:moduleId/lecons')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Ajouter une leçon à un module (admin)' })
  async ajouterLeconAuModule(@Param('moduleId') moduleFormationId: string, @Body() dto: AjouterLeconDto) {
    const lecon = await this.ajouterLecon.executer({ moduleFormationId, titre: dto.titre, urlVideo: dto.urlVideo });
    return { id: lecon.id, moduleFormationId: lecon.moduleFormationId, title: lecon.titre, videoUrl: lecon.urlVideo };
  }

  @Post('modules/:moduleId/quiz')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Ajouter le quiz de validation d’un module (admin)' })
  async ajouterQuizAuModule(@Param('moduleId') moduleFormationId: string, @Body() dto: AjouterQuizDto) {
    const quiz = await this.ajouterQuiz.executer({
      moduleFormationId,
      seuilReussite: dto.seuilReussite,
      questions: dto.questions,
    });
    return { id: quiz.id, moduleFormationId: quiz.moduleFormationId, passScore: quiz.seuilReussite };
  }

  @Post(':id/inscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'S’inscrire à une formation' })
  async inscription(@UtilisateurCourant() utilisateur: Utilisateur, @Param('id') formationId: string) {
    const inscription = await this.sInscrire.executer({ membreId: utilisateur.id!, formationId });
    return { id: inscription.id, formationId: inscription.formationId, status: inscription.statut };
  }

  @Post('lecons/:leconId/suivre')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer une leçon comme suivie' })
  async suivre(@UtilisateurCourant() utilisateur: Utilisateur, @Param('leconId') leconId: string) {
    const progression = await this.suivreLecon.executer({ membreId: utilisateur.id!, leconId });
    return { lessonId: progression.leconId, completed: progression.terminee, completedAt: progression.termineeLe };
  }

  @Post('quiz/:quizId/passer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Passer le quiz de validation d’un module' })
  async passer(
    @UtilisateurCourant() utilisateur: Utilisateur,
    @Param('quizId') quizId: string,
    @Body() dto: PasserQuizDto,
  ) {
    const resultat = await this.passerQuiz.executer({
      membreId: utilisateur.id!,
      quizId,
      reponses: dto.reponses,
    });
    return {
      score: resultat.tentative.score,
      passed: resultat.tentative.reussie,
      attemptedAt: resultat.tentative.tenteeLe,
      certificateIssued: resultat.certificatDelivre,
    };
  }

  @Get(':id/ma-progression')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulter ma progression sur une formation' })
  async maProgression(@UtilisateurCourant() utilisateur: Utilisateur, @Param('id') formationId: string) {
    const inscription = await this.inscriptions.trouverParMembreEtFormation(utilisateur.id!, formationId);
    if (!inscription) {
      throw new NotFoundException('Aucune inscription à cette formation');
    }
    const progressionsInscription = await this.progressions.listerParInscriptionId(inscription.id!);
    const progressionParLeconId = new Map(progressionsInscription.map((p) => [p.leconId, p]));

    const modules = await this.modules.listerParFormationId(formationId);
    const modulesAvecProgression = await Promise.all(
      modules.map(async (m) => {
        const leconsDuModule = await this.lecons.listerParModuleId(m.id!);
        return {
          id: m.id,
          title: m.titre,
          order: m.ordre,
          lessons: leconsDuModule.map((l) => ({
            id: l.id,
            title: l.titre,
            completed: progressionParLeconId.get(l.id!)?.terminee ?? false,
            completedAt: progressionParLeconId.get(l.id!)?.termineeLe ?? null,
          })),
        };
      }),
    );

    const certificat = await this.certificats.trouverParInscriptionId(inscription.id!);

    return {
      formationId,
      status: inscription.statut,
      modules: modulesAvecProgression,
      certificateVerificationCode: certificat?.codeVerification ?? null,
    };
  }

  @Get(':id/certificat.pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Télécharger mon certificat PDF pour une formation complétée' })
  async telechargerCertificat(
    @UtilisateurCourant() utilisateur: Utilisateur,
    @Param('id') formationId: string,
    @Res({ passthrough: true }) reponse: Response,
  ): Promise<StreamableFile> {
    const formation = await this.formations.trouverParId(formationId);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }
    const inscription = await this.inscriptions.trouverParMembreEtFormation(utilisateur.id!, formationId);
    if (!inscription) {
      throw new NotFoundException('Aucune inscription à cette formation');
    }
    const certificat = await this.certificats.trouverParInscriptionId(inscription.id!);
    if (!certificat) {
      throw new ForbiddenException('Formation pas encore validée — certificat non disponible');
    }
    const membre = await this.membres.trouverParId(utilisateur.id!);

    const baseUrl = this.config.get<string>('app.baseUrl')!;
    const pdf = await this.generateurCertificatPdf.generer({
      matricule: membre?.matricule ?? utilisateur.id!,
      formationTitre: formation.titre,
      delivreLe: certificat.delivreLe,
      codeVerification: certificat.codeVerification,
      urlVerification: `${baseUrl}/api/v1/formations/certificats/${certificat.codeVerification}`,
    });

    reponse.set({ 'Content-Disposition': `attachment; filename="certificat-${formation.code}.pdf"` });
    return new StreamableFile(pdf);
  }
}
