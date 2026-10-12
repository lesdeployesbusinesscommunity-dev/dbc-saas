import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FicheFormation, Formation } from '../domaine/formation';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { ModuleFormation } from '../domaine/module-formation';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { Lecon, TypeLecon } from '../domaine/lecon';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { QuizFormation } from '../domaine/quiz-formation';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { PilierRepositoryPort } from '../../programmes/domaine/pilier.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface ContenuChapitre {
  /** Id d'un chapitre existant à modifier ; absent ou inconnu = nouveau chapitre. */
  id?: string;
  titre: string;
  objectifs: string[];
  videos: { id?: string; titre: string; url: string }[];
  documents: { id?: string; titre: string; url: string }[];
  quiz: { id?: string; quiz: QuizFormation }[];
}

export interface EnregistrerFormationCommande {
  /** Absent = nouvelle formation. */
  formationId?: string;
  titre: string;
  codeNiveau: string;
  pilierCode?: string;
  fiche: FicheFormation;
  chapitres: ContenuChapitre[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PILIER_PAR_DEFAUT = 'former';

function codeDepuisTitre(titre: string): string {
  const base = titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base || 'formation'}-${randomUUID().slice(0, 6)}`;
}

/**
 * "Gestion des formations" (administrateur) : crée ou met à jour une
 * formation ENTIÈRE — sa fiche et son programme (chapitres, vidéos, supports
 * PDF, quiz) — dans la forme qu'édite l'interface. Les chapitres et leçons
 * qui existent déjà gardent leur identifiant (l'avancement des membres est
 * conservé) ; ceux qui ne figurent plus dans le programme sont supprimés.
 */
@Injectable()
export class EnregistrerFormationUseCase {
  constructor(
    private readonly formations: FormationRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly piliers: PilierRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: EnregistrerFormationCommande): Promise<Formation> {
    const niveau = await this.niveaux.trouverParCode(commande.codeNiveau);
    if (!niveau) {
      throw new NotFoundException('Niveau inconnu');
    }
    const pilierCode = commande.pilierCode ?? PILIER_PAR_DEFAUT;
    if (!(await this.piliers.listerTous()).some((p) => p.code === pilierCode)) {
      throw new NotFoundException('Pilier introuvable');
    }

    let formation: Formation;
    if (commande.formationId) {
      const existante = await this.formations.trouverParId(commande.formationId);
      if (!existante) {
        throw new NotFoundException('Formation introuvable');
      }
      formation = existante;
    } else {
      formation = Formation.creer({
        code: codeDepuisTitre(commande.titre),
        titre: commande.titre,
        niveauRequisId: niveau.id,
        pilierCode,
      });
    }
    const resultat = formation.modifier({
      titre: commande.titre,
      niveauRequisId: niveau.id,
      pilierCode,
      fiche: commande.fiche,
    });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    // Les leçons sont validées AVANT toute écriture : un programme invalide ne laisse rien à moitié enregistré.
    this.validerProgramme(commande.chapitres);

    const sauvegardee = await this.formations.sauvegarder(formation);
    await this.synchroniserProgramme(sauvegardee.id!, commande.chapitres);

    await this.enregistrerAudit.executer({
      action: commande.formationId ? 'formation_modifiee' : 'formation_creee',
      typeEntite: 'Formation',
      acteurId: null,
      metadonnees: { formationId: sauvegardee.id, titre: sauvegardee.titre, chapitres: commande.chapitres.length },
    });
    return sauvegardee;
  }

  private leconsVoulues(chapitre: ContenuChapitre) {
    return [
      ...chapitre.videos.map((v) => ({ id: v.id, titre: v.titre, type: 'video' as TypeLecon, url: v.url, quiz: null })),
      ...chapitre.documents.map((d) => ({ id: d.id, titre: d.titre, type: 'pdf' as TypeLecon, url: d.url, quiz: null })),
      ...chapitre.quiz.map((q) => ({ id: q.id, titre: q.quiz.titre, type: 'quiz' as TypeLecon, url: '', quiz: q.quiz })),
    ];
  }

  private validerProgramme(chapitres: ContenuChapitre[]): void {
    chapitres.forEach((chapitre) => {
      if (!chapitre.titre.trim()) {
        throw new BadRequestException('Chaque chapitre doit avoir un titre');
      }
      this.leconsVoulues(chapitre).forEach((voulue) => {
        const essai = Lecon.creer({ moduleFormationId: 'validation', ...voulue });
        if (!essai.succes) {
          throw new BadRequestException(essai.erreur);
        }
      });
    });
  }

  private async synchroniserProgramme(formationId: string, chapitres: ContenuChapitre[]): Promise<void> {
    const existants = await this.modules.listerParFormationId(formationId);
    const gardes = new Set<string>();

    for (const [index, chapitre] of chapitres.entries()) {
      const existant = chapitre.id && UUID.test(chapitre.id) ? existants.find((m) => m.id === chapitre.id) : undefined;
      let module: ModuleFormation;
      if (existant) {
        existant.modifier({ titre: chapitre.titre.trim(), ordre: index + 1, objectifs: chapitre.objectifs });
        module = await this.modules.sauvegarder(existant);
      } else {
        module = await this.modules.sauvegarder(
          ModuleFormation.creer({ formationId, titre: chapitre.titre.trim(), ordre: index + 1, objectifs: chapitre.objectifs }),
        );
      }
      gardes.add(module.id!);
      await this.synchroniserLecons(module.id!, this.leconsVoulues(chapitre));
    }

    for (const module of existants.filter((m) => !gardes.has(m.id!))) {
      for (const lecon of await this.lecons.listerParModuleId(module.id!)) {
        await this.lecons.supprimer(lecon.id!);
      }
      await this.modules.supprimer(module.id!);
    }
  }

  private async synchroniserLecons(
    moduleId: string,
    voulues: { id?: string; titre: string; type: TypeLecon; url: string; quiz: QuizFormation | null }[],
  ): Promise<void> {
    const existantes = await this.lecons.listerParModuleId(moduleId);
    const gardees = new Set<string>();

    for (const [ordre, voulue] of voulues.entries()) {
      const existante = voulue.id && UUID.test(voulue.id) ? existantes.find((l) => l.id === voulue.id) : undefined;
      if (existante) {
        existante.modifier({ titre: voulue.titre, type: voulue.type, url: voulue.url, quiz: voulue.quiz, ordre });
        gardees.add((await this.lecons.sauvegarder(existante)).id!);
      } else {
        const creee = Lecon.creer({ moduleFormationId: moduleId, ...voulue, ordre });
        gardees.add((await this.lecons.sauvegarder(creee.valeur!)).id!);
      }
    }

    for (const lecon of existantes.filter((l) => !gardees.has(l.id!))) {
      await this.lecons.supprimer(lecon.id!);
    }
  }
}
