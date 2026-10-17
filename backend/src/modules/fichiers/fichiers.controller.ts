import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { unlink } from 'fs/promises';
import { JwtAuthGuard } from '../identite-acces/interface/jwt-auth.guard';
import { TYPES_AUTORISES, TAILLE_MAXIMUM_OCTETS, dossierFichiers, typeDeFichier } from './fichiers.config';
import { StockageFichiersPort } from './stockage-fichiers.port';

/** Sous-ensemble du fichier fourni par multer dont on a besoin. */
interface FichierTeleverse {
  originalname: string;
  mimetype: string;
  size: number;
  filename: string;
  path: string;
}

/**
 * Téléversement de fichiers (photo de profil, affiche ou vidéo de formation,
 * support PDF...). Le fichier est stocké sous un nom aléatoire — jamais celui
 * fourni par le navigateur — puis publié par StockageFichiersPort (Cloudflare
 * R2 en production, disque du serveur en local). Seuls les types listés dans fichiers.config.ts sont acceptés,
 * avec une taille maximum par type.
 */
@ApiTags('fichiers')
@Controller('fichiers')
export class FichiersController {
  constructor(private readonly stockage: StockageFichiersPort) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Téléverser un fichier (image, vidéo ou PDF) — renvoie son URL publique' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _fichier, rappel) => rappel(null, dossierFichiers()),
        filename: (_req, fichier, rappel) => rappel(null, `${randomUUID()}${extname(fichier.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: TAILLE_MAXIMUM_OCTETS.video },
      fileFilter: (_req, fichier, rappel) => {
        if (!TYPES_AUTORISES.includes(fichier.mimetype)) {
          rappel(new BadRequestException('Type de fichier non autorisé'), false);
          return;
        }
        rappel(null, true);
      },
    }),
  )
  async televerser(@UploadedFile() fichier: FichierTeleverse | undefined) {
    if (!fichier) {
      throw new BadRequestException('Aucun fichier reçu (champ "file")');
    }
    const type = typeDeFichier(fichier.mimetype);
    if (fichier.size > TAILLE_MAXIMUM_OCTETS[type]) {
      await unlink(fichier.path).catch(() => undefined);
      throw new BadRequestException(`Fichier trop volumineux pour un fichier de type ${type}`);
    }
    const url = await this.stockage.publier({
      chemin: fichier.path,
      nom: fichier.filename,
      mimetype: fichier.mimetype,
      taille: fichier.size,
    });
    return {
      url,
      type,
      name: fichier.originalname,
      size: fichier.size,
    };
  }
}
