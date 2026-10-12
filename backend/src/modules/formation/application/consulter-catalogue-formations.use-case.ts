import { Injectable } from '@nestjs/common';
import { Formation } from '../domaine/formation';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { ModuleFormation } from '../domaine/module-formation';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { Lecon } from '../domaine/lecon';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { NiveauAdhesionRepositoryPort } from '../../adhesion/domaine/niveau-adhesion.repository.port';

export interface FormationDetaillee {
  formation: Formation;
  niveauCode: string | null;
  chapitres: { chapitre: ModuleFormation; lecons: Lecon[] }[];
}

/**
 * Le catalogue complet des formations, avec leur programme (chapitres et
 * leçons dans l'ordre) — lu par la page Formation du membre et par "Gestion
 * des formations" de l'admin. C'est l'interface qui décide quoi montrer :
 * pour un membre, les bonnes réponses des quiz sont retirées (voir
 * FormationController).
 */
@Injectable()
export class ConsulterCatalogueFormationsUseCase {
  constructor(
    private readonly formations: FormationRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
    private readonly niveaux: NiveauAdhesionRepositoryPort,
  ) {}

  async executer(): Promise<FormationDetaillee[]> {
    const [formations, niveaux] = await Promise.all([this.formations.listerToutes(), this.niveaux.listerTous()]);
    const codeNiveau = new Map(niveaux.map((n) => [n.id, n.code]));

    const detaillees: FormationDetaillee[] = [];
    for (const formation of formations) {
      const chapitres = (await this.modules.listerParFormationId(formation.id!)).sort((a, b) => a.ordre - b.ordre);
      detaillees.push({
        formation,
        niveauCode: codeNiveau.get(formation.niveauRequisId) ?? null,
        chapitres: await Promise.all(
          chapitres.map(async (chapitre) => ({
            chapitre,
            lecons: (await this.lecons.listerParModuleId(chapitre.id!)).sort((a, b) => a.ordre - b.ordre),
          })),
        ),
      });
    }
    return detaillees;
  }
}
