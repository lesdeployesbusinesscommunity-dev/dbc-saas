import { BadRequestException, Injectable } from '@nestjs/common';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { ParticipationTontine } from '../domaine/participation-tontine';
import { ParticipationTontineRepositoryPort } from '../domaine/participation-tontine.repository.port';
import { TourTontine } from '../domaine/tour-tontine';
import { TourTontineRepositoryPort } from '../domaine/tour-tontine.repository.port';
import { NotifierMembreTontineService } from './notifier-membre-tontine.service';

/**
 * Ajoute un membre à une vague, que ce soit sur sa demande (4.2) ou depuis la
 * liste d'attente à l'ouverture d'une vague (4.1). Son rang = ordre d'arrivée,
 * qui fixe son tour pour bouffer. Si tous les membres présents avaient déjà
 * bouffé, aucun tour n'était en cours : on en rouvre un pour le nouveau venu.
 */
@Injectable()
export class AffectationVagueService {
  constructor(
    private readonly participations: ParticipationTontineRepositoryPort,
    private readonly tours: TourTontineRepositoryPort,
    private readonly notifier: NotifierMembreTontineService,
  ) {}

  async ajouter(groupe: GroupeTontine, membreId: string): Promise<ParticipationTontine> {
    const membres = await this.participations.listerParGroupe(groupe.id!);
    const accueil = groupe.peutAccueillir(membres.length);
    if (!accueil.succes) {
      throw new BadRequestException(accueil.erreur);
    }

    const resultat = ParticipationTontine.creer({ groupeId: groupe.id!, membreId, rang: membres.length + 1 });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const participation = await this.participations.sauvegarder(resultat.valeur!);

    const tourEnCours = await this.tours.trouverEnCours(groupe.id!);
    if (!tourEnCours) {
      const tours = await this.tours.listerParGroupe(groupe.id!);
      await this.tours.sauvegarder(
        TourTontine.ouvrir({ groupeId: groupe.id!, numero: tours.length + 1, montant: groupe.montantCagnotte }),
      );
    }

    await this.notifier.executer({
      destinataireMembreId: membreId,
      groupeId: groupe.id!,
      type: 'vague_rejointe',
      message:
        `Bienvenue dans la vague n°${groupe.numero} : vous êtes n°${participation.rang} dans l'ordre de passage. ` +
        `Votre 1re cotisation (pour DBC) est due dès aujourd'hui.`,
    });

    return participation;
  }
}
