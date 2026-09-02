/**
 * Entité de domaine pure. Un défi OTP éphémère envoyé par WhatsApp — jamais le
 * code en clair n'est stocké, seulement son hachage (voir HacheurMotDePassePort,
 * réutilisé ici : un OTP est juste un secret court-terme).
 * Cahier des charges §3.4/4.1 : 6 chiffres, validité 5 minutes, 3 tentatives max.
 */
import { randomInt } from 'crypto';
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

const DUREE_VALIDITE_MINUTES = 5;
const TENTATIVES_MAX = 3;

export function genererCodeOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export class CodeOtp {
  private constructor(
    public readonly id: string | undefined,
    public readonly utilisateurId: string,
    public readonly codeHache: string,
    public readonly expireLe: Date,
    public tentatives: number,
    public consomme: boolean,
  ) {}

  static creer(params: { utilisateurId: string; codeHache: string }): CodeOtp {
    const expireLe = new Date(Date.now() + DUREE_VALIDITE_MINUTES * 60_000);
    return new CodeOtp(undefined, params.utilisateurId, params.codeHache, expireLe, 0, false);
  }

  static depuisPersistance(donnees: {
    id: string;
    utilisateurId: string;
    codeHache: string;
    expireLe: Date;
    tentatives: number;
    consomme: boolean;
  }): CodeOtp {
    return new CodeOtp(
      donnees.id,
      donnees.utilisateurId,
      donnees.codeHache,
      donnees.expireLe,
      donnees.tentatives,
      donnees.consomme,
    );
  }

  /**
   * L'appelant a déjà comparé le code saisi au hachage (HacheurMotDePassePort,
   * opération asynchrone — ne peut pas vivre ici) ; cette méthode applique les
   * règles métier (expiration, tentatives, consommation unique).
   */
  verifierEtConsommer(codeCorrespond: boolean): ResultatOperation<void> {
    if (this.consomme) {
      return ResultatOperation.echec('Code déjà utilisé');
    }
    if (this.expireLe.getTime() < Date.now()) {
      return ResultatOperation.echec('Code expiré');
    }
    if (this.tentatives >= TENTATIVES_MAX) {
      return ResultatOperation.echec('Trop de tentatives');
    }

    this.tentatives += 1;
    if (!codeCorrespond) {
      return ResultatOperation.echec('Code invalide');
    }

    this.consomme = true;
    return ResultatOperation.ok();
  }
}
