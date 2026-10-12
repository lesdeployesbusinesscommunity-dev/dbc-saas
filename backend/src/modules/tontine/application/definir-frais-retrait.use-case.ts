import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FraisRetraitTontine } from '../domaine/frais-retrait-tontine';
import { FraisRetraitTontineRepositoryPort } from '../domaine/frais-retrait-tontine.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

/**
 * L'administrateur fixe les frais de retrait ajoutés à chaque dépôt de
 * cotisation d'un niveau. S'applique aux cotisations initiées ensuite ; celles
 * déjà initiées gardent le montant qui leur a été demandé.
 */
@Injectable()
export class DefinirFraisRetraitUseCase {
  constructor(
    private readonly frais: FraisRetraitTontineRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: { codeNiveau: string; montant: number }): Promise<FraisRetraitTontine> {
    const niveau = await this.niveaux.trouverParCode(commande.codeNiveau);
    if (!niveau) {
      throw new NotFoundException('Niveau inconnu');
    }
    const resultat = FraisRetraitTontine.definir({ niveauId: niveau.id, montant: commande.montant });
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const frais = await this.frais.sauvegarder(resultat.valeur!);

    await this.enregistrerAudit.executer({
      action: 'frais_retrait_tontine_definis',
      typeEntite: 'FraisRetraitTontine',
      acteurId: null,
      metadonnees: { niveau: niveau.code, montant: frais.montant },
    });

    return frais;
  }
}
