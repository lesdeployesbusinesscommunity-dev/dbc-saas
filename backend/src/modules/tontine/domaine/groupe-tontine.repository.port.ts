import { GroupeTontine } from './groupe-tontine';

export abstract class GroupeTontineRepositoryPort {
  abstract sauvegarder(groupe: GroupeTontine): Promise<GroupeTontine>;
  abstract trouverParId(id: string): Promise<GroupeTontine | null>;
  /** Vagues d'un niveau (ou de tous si absent), les plus récentes d'abord. */
  abstract lister(niveauId?: number): Promise<GroupeTontine[]>;
  abstract listerParResponsable(membreId: string): Promise<GroupeTontine[]>;
  abstract compterParNiveau(niveauId: number): Promise<number>;
}
