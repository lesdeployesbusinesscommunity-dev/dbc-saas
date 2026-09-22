/**
 * Port vers le fournisseur Mobile Money externe (MTN Mobile Money, Orange Money...).
 * L'implémentation réelle (appel HTTP au fournisseur) n'est pas encore branchée —
 * voir FournisseurPaiementSimule pour l'adaptateur de développement.
 */
export abstract class FournisseurPaiementPort {
  abstract initier(params: {
    montant: number;
    objet: string;
    telephone: string;
    cleIdempotence: string;
  }): Promise<void>;
}
