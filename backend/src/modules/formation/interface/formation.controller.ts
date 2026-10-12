import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AjouterModuleFormationUseCase } from '../application/ajouter-module-formation.use-case';
import { AjouterLeconUseCase } from '../application/ajouter-lecon.use-case';
import { AjouterQuizUseCase } from '../application/ajouter-quiz.use-case';
import { SInscrireFormationUseCase } from '../application/sinscrire-formation.use-case';
import { SuivreLeconUseCase } from '../application/suivre-lecon.use-case';
import { PasserQuizUseCase } from '../application/passer-quiz.use-case';
import { EnregistrerFormationUseCase } from '../application/enregistrer-formation.use-case';
import { SupprimerFormationUseCase } from '../application/supprimer-formation.use-case';
import { RepondreQuizFormationUseCase, ResultatQuizFormation } from '../application/repondre-quiz-formation.use-case';
import { RecommencerFormationUseCase } from '../application/recommencer-formation.use-case';
import {
  ConsulterCatalogueFormationsUseCase,
  FormationDetaillee,
} from '../application/consulter-catalogue-formations.use-case';
import { ConsulterMaProgressionFormationUseCase } from '../application/consulter-ma-progression-formation.use-case';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { CertificatRepositoryPort } from '../domaine/certificat.repository.port';
import { GenerateurCertificatPdfPort } from '../domaine/generateur-certificat-pdf.port';
import { QuizFormation } from '../domaine/quiz-formation';
import { AjouterModuleFormationDto } from './dto/ajouter-module-formation.dto';
import { AjouterLeconDto } from './dto/ajouter-lecon.dto';
import { AjouterQuizDto } from './dto/ajouter-quiz.dto';
import { PasserQuizDto } from './dto/passer-quiz.dto';
import { EnregistrerFormationDto, QuizDto, ReponsesQuizDto } from './dto/enregistrer-formation.dto';
import { JwtAuthGuard } from '../../identite-acces/interface/jwt-auth.guard';
import { UtilisateurCourant } from '../../identite-acces/interface/utilisateur-courant.decorator';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { EnregistrerFormationCommande } from '../application/enregistrer-formation.use-case';

/** Id du quiz de pré-requis d'une formation (il n'est pas une leçon). */
const ID_QUIZ_PREREQUIS = 'prerequis';

function versReponseQuiz(quiz: QuizFormation, id: string, avecReponses: boolean) {
  return {
    id,
    title: quiz.titre,
    passingScore: quiz.seuil,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.texte,
      options: q.options.map((o) => ({ id: o.id, text: o.texte })),
      multiple: q.bonnes.length > 1,
      // Les bonnes réponses ne partent JAMAIS vers un membre avant qu'il ait répondu.
      ...(avecReponses ? { correct: q.bonnes } : {}),
    })),
  };
}

function quizDepuisDto(dto: QuizDto): QuizFormation {
  return {
    titre: dto.title,
    seuil: dto.passingScore,
    questions: dto.questions.map((q) => ({
      id: q.id,
      texte: q.text,
      options: q.options.map((o) => ({ id: o.id, texte: o.text })),
      bonnes: q.correct,
    })),
  };
}

/** Une formation dans la forme de l'interface (fiche + chapitres avec vidéos, PDF et quiz). */
function versReponseFormation({ formation, niveauCode, chapitres }: FormationDetaillee, avecReponses: boolean) {
  const { fiche } = formation;
  return {
    id: formation.id,
    code: formation.code,
    name: formation.titre,
    levelCode: niveauCode,
    pillarCode: formation.pilierCode,
    trainer: fiche.formateur,
    poster: fiche.afficheUrl,
    startDate: fiche.dateDebut,
    duration: fiche.duree,
    domainKey: fiche.domaine,
    coinsReward: fiche.coinsRecompense > 0 ? fiche.coinsRecompense : null,
    objectives: fiche.objectifs,
    outcomes: fiche.resultats,
    coursePdf: fiche.supportPdf ? { title: fiche.supportPdf.titre, url: fiche.supportPdf.url } : null,
    prerequisiteQuiz: fiche.quizPrerequis ? versReponseQuiz(fiche.quizPrerequis, ID_QUIZ_PREREQUIS, avecReponses) : null,
    chapters: chapitres.map(({ chapitre, lecons }) => ({
      id: chapitre.id,
      title: chapitre.titre,
      objectives: chapitre.objectifs,
      videos: lecons.filter((l) => l.type === 'video').map((l) => ({ id: l.id, title: l.titre, url: l.url })),
      documents: lecons.filter((l) => l.type === 'pdf').map((l) => ({ id: l.id, title: l.titre, url: l.url })),
      quizzes: lecons.filter((l) => l.type === 'quiz').map((l) => versReponseQuiz(l.quiz!, l.id!, avecReponses)),
    })),
  };
}

function commandeDepuisDto(dto: EnregistrerFormationDto, formationId?: string): EnregistrerFormationCommande {
  return {
    formationId,
    titre: dto.name,
    codeNiveau: dto.levelCode,
    pilierCode: dto.pillarCode,
    fiche: {
      formateur: dto.trainer?.trim() || null,
      afficheUrl: dto.poster?.trim() || null,
      dateDebut: dto.startDate?.trim() || null,
      duree: dto.duration?.trim() || null,
      domaine: dto.domainKey?.trim() || null,
      coinsRecompense: dto.coinsReward ?? 0,
      objectifs: dto.objectives.map((o) => o.trim()).filter(Boolean),
      resultats: dto.outcomes.map((o) => o.trim()).filter(Boolean),
      supportPdf: dto.coursePdf ? { titre: dto.coursePdf.title, url: dto.coursePdf.url } : null,
      quizPrerequis: dto.prerequisiteQuiz ? quizDepuisDto(dto.prerequisiteQuiz) : null,
    },
    chapitres: dto.chapters.map((c) => ({
      id: c.id,
      titre: c.title,
      objectifs: c.objectives.map((o) => o.trim()).filter(Boolean),
      videos: c.videos.map((v) => ({ id: v.id, titre: v.title, url: v.url })),
      documents: c.documents.map((d) => ({ id: d.id, titre: d.title, url: d.url })),
      quiz: c.quizzes.map((q) => ({ id: q.id, quiz: quizDepuisDto(q) })),
    })),
  };
}

/** Réponses d'un membre, nettoyées : seules des listes d'ids de type texte comptent. */
function reponsesPropres(dto: ReponsesQuizDto): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(dto.answers ?? {})
      .filter(([, valeur]) => Array.isArray(valeur))
      .map(([question, valeur]) => [question, (valeur as unknown[]).map(String)]),
  );
}

function versReponseResultatQuiz(resultat: ResultatQuizFormation) {
  return {
    results: resultat.correction.parQuestion,
    correctCount: resultat.correction.bonnes,
    total: resultat.correction.total,
    percent: resultat.correction.pourcentage,
    passed: resultat.correction.reussi,
    correctAnswers: resultat.bonnesReponses,
    trainingCompleted: resultat.formationTerminee,
  };
}

@ApiTags('formation')
@Controller('formations')
export class FormationController {
  constructor(
    private readonly ajouterModule: AjouterModuleFormationUseCase,
    private readonly ajouterLecon: AjouterLeconUseCase,
    private readonly ajouterQuiz: AjouterQuizUseCase,
    private readonly sInscrire: SInscrireFormationUseCase,
    private readonly suivreLecon: SuivreLeconUseCase,
    private readonly passerQuiz: PasserQuizUseCase,
    private readonly enregistrerFormation: EnregistrerFormationUseCase,
    private readonly supprimerFormation: SupprimerFormationUseCase,
    private readonly repondreQuiz: RepondreQuizFormationUseCase,
    private readonly recommencerFormation: RecommencerFormationUseCase,
    private readonly consulterCatalogue: ConsulterCatalogueFormationsUseCase,
    private readonly consulterMaProgression: ConsulterMaProgressionFormationUseCase,
    private readonly formations: FormationRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly progressions: ProgressionLeconRepositoryPort,
    private readonly certificats: CertificatRepositoryPort,
    private readonly generateurCertificatPdf: GenerateurCertificatPdfPort,
    private readonly config: ConfigService,
    private readonly membres: MembreRepositoryPort,
  ) {}

  // Routes fixes AVANT ":id", pour qu'elles ne soient pas prises pour un identifiant.

  @Get()
  @ApiOperation({ summary: 'Catalogue des formations avec leur programme (quiz sans les bonnes réponses)' })
  async lister() {
    return (await this.consulterCatalogue.executer()).map((f) => versReponseFormation(f, false));
  }

  @Get('admin/catalogue')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Catalogue complet, bonnes réponses des quiz comprises (admin)' })
  async listerPourAdmin() {
    return (await this.consulterCatalogue.executer()).map((f) => versReponseFormation(f, true));
  }

  @Get('ma-progression')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon avancement dans chaque formation commencée' })
  async maProgressionGlobale(@UtilisateurCourant() utilisateur: Utilisateur) {
    return (await this.consulterMaProgression.executer(utilisateur.id!)).map((p) => ({
      trainingId: p.formationId,
      completedLessonIds: p.leconsTerminees,
      quizzes: Object.fromEntries(
        Object.entries(p.quiz).map(([id, q]) => [id, { best: q.meilleurScore, attempts: q.tentatives }]),
      ),
      prerequisite: { passed: p.prerequis.reussi, best: p.prerequis.meilleurScore, attempts: p.prerequis.tentatives },
      lastLessonId: p.derniereLeconId,
      updatedAt: p.misAJourLe,
      completedAt: p.termineeLe,
      certificateCode: p.codeCertificat,
    }));
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
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une formation complète : fiche et programme (admin)' })
  async creer(@Body() dto: EnregistrerFormationDto) {
    const formation = await this.enregistrerFormation.executer(commandeDepuisDto(dto));
    return this.detailAdmin(formation.id!);
  }

  @Put(':id')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remplacer la fiche et le programme d’une formation (admin)' })
  async modifier(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EnregistrerFormationDto) {
    await this.enregistrerFormation.executer(commandeDepuisDto(dto, id));
    return this.detailAdmin(id);
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: false })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une formation et son programme (admin)' })
  async supprimer(@Param('id', ParseUUIDPipe) id: string) {
    await this.supprimerFormation.executer(id);
    return { deleted: true };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Une formation et son programme (quiz sans les bonnes réponses)' })
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    const formation = (await this.consulterCatalogue.executer()).find((f) => f.formation.id === id);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }
    return versReponseFormation(formation, false);
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
  @ApiOperation({ summary: 'Ajouter une leçon vidéo à un module (admin)' })
  async ajouterLeconAuModule(@Param('moduleId') moduleFormationId: string, @Body() dto: AjouterLeconDto) {
    const lecon = await this.ajouterLecon.executer({ moduleFormationId, titre: dto.titre, urlVideo: dto.urlVideo });
    return { id: lecon.id, moduleFormationId: lecon.moduleFormationId, title: lecon.titre, videoUrl: lecon.url };
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
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vidéo regardée ou PDF ouvert : la leçon est terminée' })
  async suivre(@UtilisateurCourant() utilisateur: Utilisateur, @Param('leconId', ParseUUIDPipe) leconId: string) {
    const { progression, formationTerminee } = await this.suivreLecon.executer({ membreId: utilisateur.id!, leconId });
    return {
      lessonId: progression.leconId,
      completed: progression.terminee,
      completedAt: progression.termineeLe,
      trainingCompleted: formationTerminee,
    };
  }

  @Post('lecons/:leconId/quiz')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Répondre au quiz d’un chapitre (corrigé côté serveur)' })
  async repondreQuizLecon(
    @UtilisateurCourant() utilisateur: Utilisateur,
    @Param('leconId', ParseUUIDPipe) leconId: string,
    @Body() dto: ReponsesQuizDto,
  ) {
    const resultat = await this.repondreQuiz.quizDeLecon({
      membreId: utilisateur.id!,
      leconId,
      reponses: reponsesPropres(dto),
    });
    return versReponseResultatQuiz(resultat);
  }

  @Post(':id/prerequis')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Répondre au quiz de pré-requis d’une formation (corrigé côté serveur)' })
  async repondrePrerequis(
    @UtilisateurCourant() utilisateur: Utilisateur,
    @Param('id', ParseUUIDPipe) formationId: string,
    @Body() dto: ReponsesQuizDto,
  ) {
    const resultat = await this.repondreQuiz.quizDePrerequis({
      membreId: utilisateur.id!,
      formationId,
      reponses: reponsesPropres(dto),
    });
    return versReponseResultatQuiz(resultat);
  }

  @Post(':id/recommencer')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recommencer la formation (l’avancement repart de zéro, les acquis restent)' })
  async recommencer(@UtilisateurCourant() utilisateur: Utilisateur, @Param('id', ParseUUIDPipe) formationId: string) {
    await this.recommencerFormation.executer({ membreId: utilisateur.id!, formationId });
    return { restarted: true };
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

  private async detailAdmin(id: string) {
    const formation = (await this.consulterCatalogue.executer()).find((f) => f.formation.id === id);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }
    return versReponseFormation(formation, true);
  }
}
