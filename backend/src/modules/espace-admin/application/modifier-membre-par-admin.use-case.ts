import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProfilMembre } from '../../adhesion/domaine/membre';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { HistoriqueNiveauMembre } from '../../adhesion/domaine/historique-niveau-membre';
import { UtilisateurRepositoryPort } from '../../identite-acces/domaine/utilisateur.repository.port';
import { TransactionCoinsRepositoryPort } from '../../gamification/domaine/transaction-coins.repository.port';
import { AttribuerCoinsManuellementUseCase } from '../../gamification/application/attribuer-coins-manuellement.use-case';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

export interface ModifierMembreParAdminCommande {
  membreId: string;
  profil?: Partial<ProfilMembre>;
  email?: string | null;
  codeNiveau?: string;
  /** "actif" réactive un compte désactivé, "desactive" le suspend. */
  statut?: 'actif' | 'desactive';
  /** Nouveau solde de Coins voulu : l'écart est inscrit au registre comme un ajustement admin. */
  soldeCoins?: number;
}

/**
 * "Mettre à jour", "Désactiver" / "Réactiver" un membre depuis "Gestion des
 * membres". Chaque changement passe par la règle du module concerné : le
 * niveau est historisé (Adhésion), la désactivation suspend le compte
 * (Identité & accès — plus de connexion possible), et un changement de solde
 * de Coins devient une transaction d'ajustement (le registre de Coins n'est
 * jamais réécrit). Tout est inscrit au journal d'audit.
 */
@Injectable()
export class ModifierMembreParAdminUseCase {
  constructor(
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly utilisateurs: UtilisateurRepositoryPort,
    private readonly transactions: TransactionCoinsRepositoryPort,
    private readonly attribuerCoins: AttribuerCoinsManuellementUseCase,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: ModifierMembreParAdminCommande): Promise<void> {
    const membre = await this.membres.trouverParId(commande.membreId);
    const utilisateur = await this.utilisateurs.trouverParId(commande.membreId);
    if (!membre || !utilisateur || utilisateur.statut === 'supprime') {
      throw new NotFoundException('Membre introuvable');
    }

    if (commande.profil) {
      membre.mettreAJourProfil(commande.profil);
    }
    if (commande.codeNiveau) {
      const niveau = await this.niveaux.trouverParCode(commande.codeNiveau);
      if (!niveau) {
        throw new NotFoundException('Niveau inconnu');
      }
      if (niveau.id !== membre.niveauActuelId) {
        membre.changerNiveau(niveau.id);
        await this.membres.ajouterHistorique(
          HistoriqueNiveauMembre.ouvrir({ membreId: membre.id, niveauId: niveau.id, motif: 'Changement de niveau par l’administrateur' }),
        );
      }
    }
    await this.membres.sauvegarder(membre);

    let compteModifie = false;
    if (commande.email !== undefined) {
      utilisateur.changerEmail(commande.email?.trim() || undefined);
      compteModifie = true;
    }
    if (commande.statut === 'desactive' && utilisateur.statut !== 'suspendu') {
      const resultat = utilisateur.suspendre();
      if (!resultat.succes) throw new BadRequestException(resultat.erreur);
      compteModifie = true;
    }
    if (commande.statut === 'actif' && utilisateur.statut === 'suspendu') {
      const resultat = utilisateur.reactiver();
      if (!resultat.succes) throw new BadRequestException(resultat.erreur);
      compteModifie = true;
    }
    if (compteModifie) {
      await this.utilisateurs.sauvegarder(utilisateur);
    }

    if (commande.soldeCoins !== undefined) {
      const ecart = commande.soldeCoins - (await this.transactions.dernierSolde(membre.id));
      if (ecart !== 0) {
        await this.attribuerCoins.executer({ membreId: membre.id, delta: ecart, motif: 'Ajustement par l’administrateur' });
      }
    }

    await this.enregistrerAudit.executer({
      action: 'membre_modifie_par_admin',
      typeEntite: 'Membre',
      acteurId: null,
      metadonnees: {
        membreId: membre.id,
        niveau: commande.codeNiveau,
        statut: commande.statut,
        soldeCoins: commande.soldeCoins,
      },
    });
  }
}
