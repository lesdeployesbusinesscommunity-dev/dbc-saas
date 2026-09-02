import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublierAnnonceUseCase } from '../application/publier-annonce.use-case';
import { AnnonceRepositoryPort } from '../domaine/annonce.repository.port';
import { JournalAuditRepositoryPort } from '../domaine/journal-audit.repository.port';
import { PublierAnnonceDto } from './dto/publier-annonce.dto';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

@ApiTags('gouvernance')
@Controller('gouvernance')
export class GouvernanceController {
  constructor(
    private readonly publierAnnonce: PublierAnnonceUseCase,
    private readonly annonces: AnnonceRepositoryPort,
    private readonly journal: JournalAuditRepositoryPort,
  ) {}

  @Post('annonces')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Publier une annonce (Directeur / Administrateur)' })
  async publier(@Body() dto: PublierAnnonceDto) {
    const annonce = await this.publierAnnonce.executer({
      titre: dto.title,
      contenu: dto.content,
      niveauCibleId: dto.targetLevelId,
    });
    return { id: annonce.id, title: annonce.titre, publishedAt: annonce.publieeLe };
  }

  @Get('annonces')
  @ApiOperation({ summary: 'Lister les annonces récentes' })
  @ApiQuery({ name: 'limit', required: false })
  async listerAnnonces(@Query('limit') limite?: string) {
    const annonces = await this.annonces.listerRecentes(limite ? parseInt(limite, 10) : 20);
    return annonces.map((a) => ({
      id: a.id,
      title: a.titre,
      content: a.contenu,
      targetLevelId: a.niveauCibleId,
      publishedAt: a.publieeLe,
    }));
  }

  @Get('audit')
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: "Consulter le journal d'audit (Administrateur)" })
  @ApiQuery({ name: 'limit', required: false })
  async consulterAudit(@Query('limit') limite?: string) {
    const entrees = await this.journal.lister(limite ? parseInt(limite, 10) : 50);
    return entrees.map((e) => ({
      action: e.action,
      entityType: e.typeEntite,
      actorId: e.acteurId,
      metadata: e.metadonnees,
    }));
  }
}
