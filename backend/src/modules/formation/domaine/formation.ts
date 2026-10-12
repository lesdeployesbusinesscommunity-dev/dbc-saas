/**
 * Entité de domaine pure. Reflète "Formation" du cahier de conception,
 * module 7 (LMS). Deux champs n'y figurent pas mais sont explicitement
 * requis par le Cahier des Charges §5.1 / §3.2 (schéma `formations` :
 * "pilier_id · niveau_requis") :
 * - `niveauRequisId` : accès conditionnel au niveau DBC (ex. École des
 *   Affaires Niv.2 requiert DBC Bâtisseur) — référence par id vers
 *   NiveauAdhesion (module Adhésion).
 * - `pilierCode` : rattachement au pilier stratégique — référence par code
 *   vers Pilier (module Programmes, "former"/"financer"/"reseauter"/"investir").
 * Jamais de dépendance directe entre entités de modules — références par
 * identifiant uniquement.
 *
 * La fiche descriptive (formateur, affiche, date de début, durée, domaine,
 * objectifs, acquis, support PDF, quiz de pré-requis, Coins gagnés en la
 * terminant) est celle que l'administrateur remplit dans "Gestion des
 * formations".
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';
import { QuizFormation, validerQuiz } from './quiz-formation';

export interface DocumentFormation {
  titre: string;
  url: string;
}

export interface FicheFormation {
  formateur: string | null;
  afficheUrl: string | null;
  dateDebut: string | null; // AAAA-MM-JJ
  duree: string | null; // ex. "4 semaines"
  domaine: string | null;
  coinsRecompense: number;
  objectifs: string[];
  resultats: string[];
  supportPdf: DocumentFormation | null;
  quizPrerequis: QuizFormation | null;
}

export const FICHE_VIDE: FicheFormation = {
  formateur: null,
  afficheUrl: null,
  dateDebut: null,
  duree: null,
  domaine: null,
  coinsRecompense: 0,
  objectifs: [],
  resultats: [],
  supportPdf: null,
  quizPrerequis: null,
};

export class Formation {
  private constructor(
    public readonly id: string | undefined,
    public readonly code: string,
    public titre: string,
    public niveauRequisId: number,
    public pilierCode: string,
    public fiche: FicheFormation,
  ) {}

  static creer(params: {
    code: string;
    titre: string;
    niveauRequisId: number;
    pilierCode: string;
    fiche?: Partial<FicheFormation>;
  }): Formation {
    return new Formation(undefined, params.code, params.titre, params.niveauRequisId, params.pilierCode, {
      ...FICHE_VIDE,
      ...params.fiche,
    });
  }

  static depuisPersistance(donnees: {
    id: string;
    code: string;
    titre: string;
    niveauRequisId: number;
    pilierCode: string;
    fiche: FicheFormation;
  }): Formation {
    return new Formation(donnees.id, donnees.code, donnees.titre, donnees.niveauRequisId, donnees.pilierCode, donnees.fiche);
  }

  modifier(params: { titre: string; niveauRequisId: number; pilierCode: string; fiche: FicheFormation }): ResultatOperation<void> {
    if (!params.titre.trim()) {
      return ResultatOperation.echec('Le titre de la formation est obligatoire');
    }
    if (params.fiche.coinsRecompense < 0) {
      return ResultatOperation.echec('Les Coins gagnés ne peuvent pas être négatifs');
    }
    if (params.fiche.quizPrerequis) {
      const quiz = validerQuiz(params.fiche.quizPrerequis);
      if (!quiz.succes) {
        return quiz;
      }
    }
    this.titre = params.titre.trim();
    this.niveauRequisId = params.niveauRequisId;
    this.pilierCode = params.pilierCode;
    this.fiche = params.fiche;
    return ResultatOperation.ok();
  }
}
