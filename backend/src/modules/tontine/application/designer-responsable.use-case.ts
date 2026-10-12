import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupeTontine } from '../domaine/groupe-tontine';
import { GroupeTontineRepositoryPort } from '../domaine/groupe-tontine.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { EnregistrerAuditUseCase } from '../../gouvernance/application/enregistrer-audit.use-case';

/** L'administrateur désigne (ou retire, avec null) le responsable d'une vague. */
@Injectable()
export class DesignerResponsableUseCase {
  constructor(
    private readonly groupes: GroupeTontineRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly enregistrerAudit: EnregistrerAuditUseCase,
  ) {}

  async executer(commande: { groupeId: string; membreId: string | null }): Promise<GroupeTontine> {
    const groupe = await this.groupes.trouverParId(commande.groupeId);
    if (!groupe) {
      throw new NotFoundException('Vague introuvable');
    }
    if (commande.membreId && !(await this.membres.trouverParId(commande.membreId))) {
      throw new NotFoundException('Responsable introuvable parmi les membres');
    }

    const resultat = groupe.designerResponsable(commande.membreId);
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    const sauvegarde = await this.groupes.sauvegarder(groupe);

    await this.enregistrerAudit.executer({
      action: 'responsable_vague_designe',
      typeEntite: 'GroupeTontine',
      acteurId: null,
      metadonnees: { groupeId: sauvegarde.id, responsableMembreId: commande.membreId },
    });

    return sauvegarde;
  }
}
