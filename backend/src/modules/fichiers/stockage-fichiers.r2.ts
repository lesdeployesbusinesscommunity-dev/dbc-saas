import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { StockageFichiersPort } from './stockage-fichiers.port';

export interface ConfigurationR2 {
  compte: string;
  cleAcces: string;
  cleSecrete: string;
  bucket: string;
  urlPublique: string;
}

/**
 * Stockage dans Cloudflare R2 (production) : le fichier est envoyé au bucket
 * puis supprimé du disque du serveur, et servi par l'URL publique du bucket.
 */
@Injectable()
export class StockageFichiersR2 extends StockageFichiersPort {
  private readonly client: S3Client;
  private readonly r2: ConfigurationR2;

  constructor(config: ConfigService) {
    super();
    this.r2 = config.get<ConfigurationR2>('fichiers.r2')!;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.r2.compte}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: this.r2.cleAcces, secretAccessKey: this.r2.cleSecrete },
    });
  }

  async publier(fichier: { chemin: string; nom: string; mimetype: string; taille: number }): Promise<string> {
    const corps = createReadStream(fichier.chemin);
    // Une erreur de lecture est déjà remontée par send() : sans écouteur, elle
    // ferait planter le serveur si l'envoi échoue avant la lecture du fichier.
    corps.on('error', () => undefined);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.r2.bucket,
          Key: fichier.nom,
          Body: corps,
          ContentLength: fichier.taille,
          ContentType: fichier.mimetype,
        }),
      );
    } finally {
      corps.destroy();
      await unlink(fichier.chemin).catch(() => undefined);
    }
    return `${this.r2.urlPublique.replace(/\/+$/, '')}/${fichier.nom}`;
  }
}
