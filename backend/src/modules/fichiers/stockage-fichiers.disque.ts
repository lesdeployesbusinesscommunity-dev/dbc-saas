import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockageFichiersPort } from './stockage-fichiers.port';

/**
 * Stockage sur le disque du serveur (développement local) : le fichier reste
 * dans dossierFichiers(), servi par main.ts sous /fichiers. Les fichiers sont
 * perdus à chaque redéploiement sur un hébergeur sans disque persistant.
 */
@Injectable()
export class StockageFichiersDisque extends StockageFichiersPort {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async publier(fichier: { nom: string }): Promise<string> {
    return `${this.config.get<string>('app.baseUrl')}/fichiers/${fichier.nom}`;
  }
}
