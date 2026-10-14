import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DecisionDemande, DemandeMembre, TypeDemande } from '../domaine/demande-membre';
import { DemandeMembreRepositoryPort } from '../domaine/demande-membre.repository.port';
import {
  AudienceNotification,
  LectureNotificationRepositoryPort,
} from '../domaine/lecture-notification.repository.port';
import { ConsulterEspaceMembreUseCase } from '../../espace-membre/application/consulter-espace-membre.use-case';
import { Utilisateur } from '../../identite-acces/domaine/utilisateur';

/** Les décisions sont présentées au membre sous cet identifiant : "dec-<id de la demande>". */
export const PREFIXE_DECISION = 'dec-';

export interface NotificationsUtilisateur {
  /** Côté administrateur : toutes les demandes ; côté membre : les siennes. */
  demandes: DemandeMembre[];
  lues: Record<AudienceNotification, string[]>;
}

const estAdmin = (utilisateur: Utilisateur) => utilisateur.role === 'admin';

/**
 * Demandes des membres et décisions de l'administration (page "Notifications"
 * des deux espaces) :
 * - le membre dépose une demande, ou retire celle qui est en attente ;
 * - l'administrateur la valide ou la refuse, et le membre en est prévenu ;
 * - chacun marque ses notifications comme lues.
 * La décision prévient le membre ; l'action qui en découle (changer de
 * niveau, supprimer le compte...) se fait ensuite depuis la page concernée.
 */
@Injectable()
export class DemandesMembresUseCase {
  constructor(
    private readonly demandes: DemandeMembreRepositoryPort,
    private readonly lectures: LectureNotificationRepositoryPort,
    private readonly espaceMembre: ConsulterEspaceMembreUseCase,
  ) {}

  async consulter(utilisateur: Utilisateur): Promise<NotificationsUtilisateur> {
    const [demandes, luesMembre, luesAdmin] = await Promise.all([
      estAdmin(utilisateur) ? this.demandes.listerToutes() : this.demandes.listerParMembre(utilisateur.id!),
      this.lectures.listerCles(utilisateur.id!, 'membre'),
      estAdmin(utilisateur) ? this.lectures.listerCles(utilisateur.id!, 'admin') : Promise.resolve([]),
    ]);
    return { demandes, lues: { membre: luesMembre, admin: luesAdmin } };
  }

  async deposer(utilisateur: Utilisateur, type: TypeDemande, details: Record<string, unknown>): Promise<DemandeMembre> {
    const existantes = await this.demandes.listerParMembre(utilisateur.id!);
    const identique = existantes.find((demande) => demande.estEnAttenteIdentique(type, details));
    if (identique) return identique;

    return this.demandes.sauvegarder(
      DemandeMembre.deposer({ membreId: utilisateur.id!, type, details, profil: await this.profil(utilisateur) }),
    );
  }

  /** Retire les demandes en attente de ce type (ex : "Annuler ma demande" de suppression de compte). */
  async retirer(utilisateur: Utilisateur, type: TypeDemande): Promise<void> {
    const demandes = await this.demandes.listerParMembre(utilisateur.id!);
    for (const demande of demandes.filter((d) => d.type === type && d.statut === 'pending')) {
      demande.retirer();
      await this.demandes.sauvegarder(demande);
    }
  }

  async decider(id: string, decision: DecisionDemande): Promise<DemandeMembre> {
    const demande = await this.trouver(id);
    try {
      demande.decider(decision);
    } catch (erreur) {
      throw new BadRequestException((erreur as Error).message);
    }
    return this.demandes.sauvegarder(demande);
  }

  /**
   * Marque des notifications comme lues. Une demande (fil admin) ou une
   * décision ("dec-<id>", fil membre) enregistrée change d'état ; tout autre
   * identifiant est une notification déduite, mémorisée pour cet utilisateur.
   */
  async marquerLues(utilisateur: Utilisateur, audience: AudienceNotification, ids: string[]): Promise<void> {
    if (audience === 'admin' && !estAdmin(utilisateur)) {
      throw new ForbiddenException('Réservé à l’administration');
    }
    const demandes = await (audience === 'admin'
      ? this.demandes.listerToutes()
      : this.demandes.listerParMembre(utilisateur.id!));
    const deduites: string[] = [];

    for (const id of new Set(ids)) {
      const demande =
        audience === 'admin'
          ? demandes.find((d) => d.id === id)
          : demandes.find((d) => `${PREFIXE_DECISION}${d.id}` === id && d.aUneDecision);
      if (!demande) {
        deduites.push(id);
        continue;
      }
      if (audience === 'admin' && !demande.lueParAdmin) {
        demande.lueParAdmin = true;
        await this.demandes.sauvegarder(demande);
      }
      if (audience === 'membre' && !demande.decisionLueParMembre) {
        demande.decisionLueParMembre = true;
        await this.demandes.sauvegarder(demande);
      }
    }
    await this.lectures.ajouter(utilisateur.id!, audience, deduites);
  }

  /** Le profil du membre au moment de la demande : ce que l'administrateur examine. */
  private async profil(utilisateur: Utilisateur): Promise<Record<string, unknown>> {
    const espace = await this.espaceMembre.executer(utilisateur);
    const profil = espace.profil;
    return {
      name: [profil.firstName, profil.lastName].filter(Boolean).join(' ') || espace.moi?.nom || null,
      firstName: profil.firstName,
      lastName: profil.lastName,
      membershipNumber: profil.membershipNumber,
      email: profil.email,
      whatsapp: profil.phoneNumber,
      city: profil.city,
      country: profil.country,
      profession: profil.profession,
      levelCodes: espace.niveaux.actifsCodes.length
        ? espace.niveaux.actifsCodes
        : [espace.niveaux.adhesionCode].filter(Boolean),
      coins: espace.coins.solde,
      sponsoredCount: espace.reseau.filleulsDirects,
    };
  }

  private async trouver(id: string): Promise<DemandeMembre> {
    const demande = await this.demandes.trouverParId(id);
    if (!demande) {
      throw new NotFoundException('Demande introuvable');
    }
    return demande;
  }
}
