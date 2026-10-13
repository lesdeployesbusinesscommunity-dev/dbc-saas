import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PREFIXE_CODE_PROGRAMME_AJOUTE, Programme, StatutProgramme } from '../domaine/programme';
import { ProgrammeRepositoryPort } from '../domaine/programme.repository.port';
import { PilierRepositoryPort } from '../domaine/pilier.repository.port';

export interface ReglagesProgramme {
  nom?: string;
  statut?: StatutProgramme;
  visible?: boolean;
  resume?: string | null;
  explication?: string | null;
}

/**
 * Page "Piliers" de l'administrateur : régler un programme (statut,
 * visibilité, textes), en ajouter un dans un pilier, supprimer un programme
 * ajouté. Le code d'un programme ajouté est choisi par l'interface (pour
 * qu'elle l'affiche aussitôt) mais doit commencer par "custom-".
 */
@Injectable()
export class ReglerProgrammesUseCase {
  constructor(
    private readonly programmes: ProgrammeRepositoryPort,
    private readonly piliers: PilierRepositoryPort,
  ) {}

  async regler(code: string, reglages: ReglagesProgramme): Promise<Programme> {
    const programme = await this.trouver(code);
    try {
      programme.regler(reglages);
    } catch (erreur) {
      throw new BadRequestException((erreur as Error).message);
    }
    return this.programmes.sauvegarder(programme);
  }

  async ajouter(params: {
    code: string;
    pilierCode: string;
    nom: string;
    statut: StatutProgramme;
    visible: boolean;
    resume?: string | null;
    explication?: string | null;
  }): Promise<Programme> {
    if (!params.code.startsWith(PREFIXE_CODE_PROGRAMME_AJOUTE)) {
      throw new BadRequestException(`Le code d'un programme ajouté commence par "${PREFIXE_CODE_PROGRAMME_AJOUTE}"`);
    }
    if (!params.nom.trim()) {
      throw new BadRequestException('Le nom du programme est obligatoire');
    }
    const piliers = await this.piliers.listerTous();
    if (!piliers.some((pilier) => pilier.code === params.pilierCode)) {
      throw new BadRequestException('Pilier inconnu');
    }
    if (await this.programmes.trouverParCode(params.code)) {
      throw new ConflictException('Un programme porte déjà ce code');
    }
    return this.programmes.sauvegarder(Programme.ajouter(params));
  }

  async supprimer(code: string): Promise<void> {
    const programme = await this.trouver(code);
    if (!programme.peutEtreSupprime) {
      throw new BadRequestException('Un programme du catalogue DBC ne se supprime pas : masquez-le');
    }
    await this.programmes.supprimer(code);
  }

  private async trouver(code: string): Promise<Programme> {
    const programme = await this.programmes.trouverParCode(code);
    if (!programme) {
      throw new NotFoundException('Programme introuvable');
    }
    return programme;
  }
}
