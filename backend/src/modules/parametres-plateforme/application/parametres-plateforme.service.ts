import { BadRequestException, Injectable } from '@nestjs/common';
import { normaliserParametres, ParametresPlateforme, verifierMotDePasse } from '../domaine/parametres-plateforme';
import { ParametresPlateformeRepositoryPort } from '../domaine/parametres-plateforme.repository.port';

/** Lecture et enregistrement des réglages de la plateforme, et contrôle de la règle de mot de passe. */
@Injectable()
export class ParametresPlateformeService {
  constructor(private readonly depot: ParametresPlateformeRepositoryPort) {}

  async lire(): Promise<ParametresPlateforme> {
    return normaliserParametres(await this.depot.lire());
  }

  async enregistrer(brut: unknown): Promise<ParametresPlateforme> {
    const parametres = normaliserParametres(brut);
    await this.depot.enregistrer(parametres);
    return parametres;
  }

  /** Refuse un mot de passe qui ne respecte pas la règle choisie par l'administrateur. */
  async exigerMotDePasseConforme(motDePasse: string): Promise<void> {
    const erreur = verifierMotDePasse(motDePasse, (await this.lire()).security);
    if (erreur) {
      throw new BadRequestException(erreur);
    }
  }
}
