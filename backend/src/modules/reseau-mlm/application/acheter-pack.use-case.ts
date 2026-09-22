import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AchatPackMlm } from '../domaine/achat-pack-mlm';
import { AchatPackMlmRepositoryPort } from '../domaine/achat-pack-mlm.repository.port';
import { PackMlmRepositoryPort } from '../domaine/pack-mlm.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';
import { InitierPaiementUseCase } from '../../paiements/application/initier-paiement.use-case';

export interface AcheterPackCommande {
  membreId: string;
  telephone: string;
  codePack: string;
}

export interface AchatInitie {
  achat: AchatPackMlm;
}

/**
 * Cas d'utilisation 5.2 (moitié "initier") — inclut "Initier un paiement".
 * Le calcul des commissions n'a lieu qu'à la confirmation du paiement — voir
 * ConfirmerAchatPackUseCase.
 */
@Injectable()
export class AcheterPackUseCase {
  constructor(
    private readonly achats: AchatPackMlmRepositoryPort,
    private readonly packs: PackMlmRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
    private readonly initierPaiement: InitierPaiementUseCase,
  ) {}

  async executer(commande: AcheterPackCommande): Promise<AchatInitie> {
    const pack = await this.packs.trouverParCode(commande.codePack);
    if (!pack) {
      throw new NotFoundException('Pack inconnu');
    }

    const membre = await this.membres.trouverParId(commande.membreId);
    if (!membre) {
      throw new NotFoundException('Membre introuvable');
    }

    const niveauRequis = await this.niveaux.trouverParCode(pack.niveauRequisCode);
    if (!niveauRequis) {
      throw new NotFoundException('Niveau requis introuvable');
    }
    // Les niveaux sont semés dans l'ordre (id croissant = rang croissant) — voir AdhesionBootstrap.
    if (membre.niveauActuelId < niveauRequis.id) {
      throw new BadRequestException(`Ce pack nécessite au moins le niveau ${niveauRequis.nom}`);
    }

    const achat = AchatPackMlm.initier({
      membreId: commande.membreId,
      packId: pack.id,
      cleIdempotencePaiement: `mlm-pack:${randomUUID()}`,
    });
    const achatSauvegarde = await this.achats.sauvegarder(achat);

    await this.initierPaiement.executer({
      montant: pack.prix,
      objet: `Achat pack MLM ${pack.nom}`,
      telephone: commande.telephone,
      cleIdempotence: achatSauvegarde.cleIdempotencePaiement,
    });

    return { achat: achatSauvegarde };
  }
}
