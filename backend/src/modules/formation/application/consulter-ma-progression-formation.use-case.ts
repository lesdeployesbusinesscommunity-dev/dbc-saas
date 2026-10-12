import { Injectable } from '@nestjs/common';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { ResultatPrerequis } from '../domaine/inscription';
import { CertificatRepositoryPort } from '../domaine/certificat.repository.port';

export interface ProgressionDansUneFormation {
  formationId: string;
  leconsTerminees: string[];
  quiz: Record<string, { meilleurScore: number; tentatives: number }>;
  prerequis: ResultatPrerequis;
  derniereLeconId: string | null;
  misAJourLe: Date | null;
  termineeLe: Date | null;
  codeCertificat: string | null;
}

/**
 * L'avancement du membre dans chacune des formations qu'il a commencées :
 * leçons terminées, quiz tentés (meilleur score, tentatives), quiz de
 * pré-requis, et certificat s'il a fini.
 */
@Injectable()
export class ConsulterMaProgressionFormationUseCase {
  constructor(
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly progressions: ProgressionLeconRepositoryPort,
    private readonly certificats: CertificatRepositoryPort,
  ) {}

  async executer(membreId: string): Promise<ProgressionDansUneFormation[]> {
    const resultat: ProgressionDansUneFormation[] = [];
    for (const inscription of await this.inscriptions.listerParMembreId(membreId)) {
      const progressions = await this.progressions.listerParInscriptionId(inscription.id!);
      const parDate = [...progressions]
        .filter((p) => p.termineeLe)
        .sort((a, b) => b.termineeLe!.getTime() - a.termineeLe!.getTime());
      const certificat = await this.certificats.trouverParInscriptionId(inscription.id!);
      resultat.push({
        formationId: inscription.formationId,
        leconsTerminees: progressions.filter((p) => p.terminee).map((p) => p.leconId),
        quiz: Object.fromEntries(
          progressions
            .filter((p) => p.tentatives > 0)
            .map((p) => [p.leconId, { meilleurScore: p.meilleurScore ?? 0, tentatives: p.tentatives }]),
        ),
        prerequis: inscription.prerequis,
        derniereLeconId: parDate[0]?.leconId ?? null,
        misAJourLe: parDate[0]?.termineeLe ?? null,
        termineeLe: inscription.termineeLe,
        codeCertificat: certificat?.codeVerification ?? null,
      });
    }
    return resultat;
  }
}
