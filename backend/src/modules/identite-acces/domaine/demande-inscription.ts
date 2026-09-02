/**
 * Entité de domaine pure. Une "demande d'inscription" est ce qu'un visiteur
 * soumet avant d'avoir un compte — l'admin la valide manuellement (identité
 * vérifiée hors-ligne, ex. via WhatsApp) avant qu'un Utilisateur + Membre ne
 * soient créés. Ne fait pas partie du cahier de conception initial : processus
 * métier réel précisé après coup par le fondateur.
 */
import { ResultatOperation } from '../../../commun/domaine/resultat-operation';

export const STATUTS_DEMANDE_INSCRIPTION = ['en_attente', 'validee', 'rejetee'] as const;
export type StatutDemandeInscription = (typeof STATUTS_DEMANDE_INSCRIPTION)[number];

export class DemandeInscription {
  private constructor(
    public readonly id: string | undefined,
    public readonly nom: string,
    public readonly prenom: string,
    public readonly age: number,
    public readonly pays: string,
    public readonly telephone: string,
    public readonly codeParrain: string | undefined,
    public readonly niveauSouhaiteCode: string,
    public statut: StatutDemandeInscription,
    public utilisateurId: string | undefined,
  ) {}

  static creer(params: {
    nom: string;
    prenom: string;
    age: number;
    pays: string;
    telephone: string;
    codeParrain?: string;
    niveauSouhaiteCode: string;
  }): ResultatOperation<DemandeInscription> {
    if (!/^\+?[0-9]{8,15}$/.test(params.telephone)) {
      return ResultatOperation.echec('Numéro de téléphone invalide');
    }
    if (params.age < 18) {
      return ResultatOperation.echec('Le membre doit être majeur');
    }
    return ResultatOperation.ok(
      new DemandeInscription(
        undefined,
        params.nom,
        params.prenom,
        params.age,
        params.pays,
        params.telephone,
        params.codeParrain,
        params.niveauSouhaiteCode,
        'en_attente',
        undefined,
      ),
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    nom: string;
    prenom: string;
    age: number;
    pays: string;
    telephone: string;
    codeParrain: string | undefined;
    niveauSouhaiteCode: string;
    statut: StatutDemandeInscription;
    utilisateurId: string | undefined;
  }): DemandeInscription {
    return new DemandeInscription(
      donnees.id,
      donnees.nom,
      donnees.prenom,
      donnees.age,
      donnees.pays,
      donnees.telephone,
      donnees.codeParrain,
      donnees.niveauSouhaiteCode,
      donnees.statut,
      donnees.utilisateurId,
    );
  }

  valider(utilisateurId: string): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seule une demande en_attente peut être validée');
    }
    this.statut = 'validee';
    this.utilisateurId = utilisateurId;
    return ResultatOperation.ok();
  }

  rejeter(): ResultatOperation<void> {
    if (this.statut !== 'en_attente') {
      return ResultatOperation.echec('Seule une demande en_attente peut être rejetée');
    }
    this.statut = 'rejetee';
    return ResultatOperation.ok();
  }
}
