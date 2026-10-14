/**
 * Ce qu'un membre peut demander à l'administration : supprimer son compte,
 * passer à un niveau, participer à une rencontre, échanger des Coins contre
 * une récompense, continuer la tontine.
 */
export const TYPES_DEMANDE = ['deleteAccount', 'level', 'event', 'reward', 'tontineNext'] as const;
export type TypeDemande = (typeof TYPES_DEMANDE)[number];

/** "pending" : à traiter ; "validated" / "refused" : décidée ; "withdrawn" : retirée par le membre. */
export type StatutDemande = 'pending' | 'validated' | 'refused' | 'withdrawn';
export type DecisionDemande = 'validated' | 'refused';

const memesDetails = (a: Record<string, unknown>, b: Record<string, unknown>): boolean =>
  JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

/**
 * Entité de domaine pure. Une demande garde le profil du membre tel qu'il
 * était au moment où il l'a envoyée (c'est ce que l'administrateur examine),
 * et deux états de lecture : celui de la demande par l'administration, et
 * celui de la décision par le membre.
 */
export class DemandeMembre {
  private constructor(
    public readonly id: string | undefined,
    public readonly membreId: string,
    public readonly type: TypeDemande,
    public readonly details: Record<string, unknown>,
    public readonly profil: Record<string, unknown>,
    public statut: StatutDemande,
    public readonly creeLe: Date,
    public decideLe: Date | null,
    public lueParAdmin: boolean,
    public decisionLueParMembre: boolean,
  ) {}

  static deposer(params: {
    membreId: string;
    type: TypeDemande;
    details: Record<string, unknown>;
    profil: Record<string, unknown>;
  }): DemandeMembre {
    return new DemandeMembre(
      undefined,
      params.membreId,
      params.type,
      params.details ?? {},
      params.profil,
      'pending',
      new Date(),
      null,
      false,
      false,
    );
  }

  static depuisPersistance(donnees: {
    id: string;
    membreId: string;
    type: TypeDemande;
    details: Record<string, unknown>;
    profil: Record<string, unknown>;
    statut: StatutDemande;
    creeLe: Date;
    decideLe: Date | null;
    lueParAdmin: boolean;
    decisionLueParMembre: boolean;
  }): DemandeMembre {
    return new DemandeMembre(
      donnees.id,
      donnees.membreId,
      donnees.type,
      donnees.details,
      donnees.profil,
      donnees.statut,
      donnees.creeLe,
      donnees.decideLe,
      donnees.lueParAdmin,
      donnees.decisionLueParMembre,
    );
  }

  /** Même demande, encore à traiter : le membre ne la double pas en confirmant deux fois. */
  estEnAttenteIdentique(type: TypeDemande, details: Record<string, unknown>): boolean {
    return this.statut === 'pending' && this.type === type && memesDetails(this.details, details);
  }

  /** Le membre retire sa demande : l'administration la voit passer à "retirée". */
  retirer(): void {
    if (this.statut !== 'pending') {
      throw new Error('Seule une demande en attente peut être retirée');
    }
    this.statut = 'withdrawn';
    this.decideLe = new Date();
    this.lueParAdmin = false;
  }

  /** L'administration valide ou refuse : le membre en est prévenu. */
  decider(decision: DecisionDemande): void {
    if (this.statut !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }
    this.statut = decision;
    this.decideLe = new Date();
    this.lueParAdmin = true;
    this.decisionLueParMembre = false;
  }

  get aUneDecision(): boolean {
    return this.statut === 'validated' || this.statut === 'refused';
  }
}
