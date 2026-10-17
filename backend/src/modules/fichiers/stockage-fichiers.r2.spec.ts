import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { StockageFichiersR2 } from './stockage-fichiers.r2';

describe('StockageFichiersR2', () => {
  const config = new ConfigService({
    fichiers: {
      r2: { compte: 'compte', cleAcces: 'cle', cleSecrete: 'secret', bucket: 'dbc', urlPublique: 'https://fichiers.exemple.com/' },
    },
  });

  function fichierTemporaire() {
    const chemin = join(mkdtempSync(join(tmpdir(), 'r2-')), 'affiche.png');
    writeFileSync(chemin, 'contenu');
    return { chemin, nom: 'affiche.png', mimetype: 'image/png', taille: 7 };
  }

  afterEach(() => jest.restoreAllMocks());

  it("envoie le fichier au bucket, renvoie son URL publique et le supprime du disque", async () => {
    const envoi = jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never);
    const fichier = fichierTemporaire();

    const url = await new StockageFichiersR2(config).publier(fichier);

    expect(url).toBe('https://fichiers.exemple.com/affiche.png');
    const commande = envoi.mock.calls[0][0] as PutObjectCommand;
    expect(commande.input).toMatchObject({ Bucket: 'dbc', Key: 'affiche.png', ContentType: 'image/png', ContentLength: 7 });
    expect(existsSync(fichier.chemin)).toBe(false);
  });

  it("supprime aussi le fichier du disque si l'envoi échoue", async () => {
    jest.spyOn(S3Client.prototype, 'send').mockRejectedValue(new Error('R2 indisponible') as never);
    const fichier = fichierTemporaire();

    await expect(new StockageFichiersR2(config).publier(fichier)).rejects.toThrow('R2 indisponible');
    expect(existsSync(fichier.chemin)).toBe(false);
  });
});
