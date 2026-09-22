import { Injectable } from '@nestjs/common';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { PaiementRepositoryPort } from '../../paiements/domaine/paiement.repository.port';
import { PilierRepositoryPort } from '../../programmes/domaine/pilier.repository.port';
import { ProgrammeRepositoryPort } from '../../programmes/domaine/programme.repository.port';
import { AntenneRepositoryPort } from '../../communaute-diaspora/domaine/antenne.repository.port';

export interface RepartitionMembresParNiveau {
  niveauId: number;
  niveauNom: string;
  total: number;
}

export interface TableauDeBordAdmin {
  totalMembres: number;
  membresActifs: number;
  membresParNiveau: RepartitionMembresParNiveau[];
  totalNiveaux: number;
  totalPiliers: number;
  totalProgrammes: number;
  totalAntennes: number;
  paiements: {
    totalCollecteHistorique: number;
    totalCollecteCeMois: number;
    nombrePaiementsCompletesCeMois: number;
    totalEnAttente: number;
    nombreEnAttente: number;
  };
  /** Tontine (module 4) n'est pas encore implémenté — voir mémoire "Tontine : ambiguïté cycles". */
  cagnottesTontineEnCours: null;
  totalMembresTontine: null;
}

/**
 * Cas d'utilisation 10.3 du cahier de conception — "Consulter le tableau de
 * bord global", modèle de lecture dédié (CQRS) : compose des données en
 * lecture seule depuis Adhésion, Paiements, Programmes et Communauté &
 * diaspora, sans que ces modules aient connaissance de Gouvernance. Reprend
 * aussi les tuiles KPI de la maquette (dbc_saas_full_platform), couche 4,
 * onglet "Vue Globale" : niveaux, piliers, programmes, antennes.
 *
 * Réseau MLM, Gamification et Formation sont volontairement exclus : ils
 * importent déjà GouvernanceModule (pour l'audit), donc les importer ici
 * créerait un cycle de modules.
 */
@Injectable()
export class ConsulterTableauDeBordUseCase {
  constructor(
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly paiements: PaiementRepositoryPort,
    private readonly piliers: PilierRepositoryPort,
    private readonly programmes: ProgrammeRepositoryPort,
    private readonly antennes: AntenneRepositoryPort,
  ) {}

  async executer(): Promise<TableauDeBordAdmin> {
    const [tousMembres, tousNiveaux, tousPaiements, tousPiliers, tousProgrammes, toutesAntennes] = await Promise.all([
      this.membres.listerTous(),
      this.niveaux.listerTous(),
      this.paiements.listerTous(),
      this.piliers.listerTous(),
      this.programmes.listerTous(),
      this.antennes.listerTous(),
    ]);

    const compteParNiveau = new Map<number, number>();
    for (const membre of tousMembres) {
      compteParNiveau.set(membre.niveauActuelId, (compteParNiveau.get(membre.niveauActuelId) ?? 0) + 1);
    }
    const membresParNiveau = tousNiveaux.map((niveau) => ({
      niveauId: niveau.id,
      niveauNom: niveau.nom,
      total: compteParNiveau.get(niveau.id) ?? 0,
    }));

    const debutDuMois = new Date();
    debutDuMois.setDate(1);
    debutDuMois.setHours(0, 0, 0, 0);

    const paiementsCompletes = tousPaiements.filter((p) => p.statut === 'complete');
    const paiementsCompletesCeMois = paiementsCompletes.filter(
      (p) => p.creeLe !== undefined && p.creeLe >= debutDuMois,
    );
    const paiementsEnAttente = tousPaiements.filter((p) => p.statut === 'en_attente');

    return {
      totalMembres: tousMembres.length,
      // 'actif' est le seul statut existant tant que la désactivation de compte n'est pas implémentée.
      membresActifs: tousMembres.filter((m) => m.statut === 'actif').length,
      membresParNiveau,
      totalNiveaux: tousNiveaux.length,
      totalPiliers: tousPiliers.length,
      totalProgrammes: tousProgrammes.length,
      totalAntennes: toutesAntennes.length,
      paiements: {
        totalCollecteHistorique: paiementsCompletes.reduce((somme, p) => somme + p.montant, 0),
        totalCollecteCeMois: paiementsCompletesCeMois.reduce((somme, p) => somme + p.montant, 0),
        nombrePaiementsCompletesCeMois: paiementsCompletesCeMois.length,
        totalEnAttente: paiementsEnAttente.reduce((somme, p) => somme + p.montant, 0),
        nombreEnAttente: paiementsEnAttente.length,
      },
      cagnottesTontineEnCours: null,
      totalMembresTontine: null,
    };
  }
}
