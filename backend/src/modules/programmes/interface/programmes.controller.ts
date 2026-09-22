import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PilierRepositoryPort } from '../domaine/pilier.repository.port';
import { ProgrammeRepositoryPort } from '../domaine/programme.repository.port';

@ApiTags('programmes')
@Controller('programmes')
export class ProgrammesController {
  constructor(
    private readonly piliers: PilierRepositoryPort,
    private readonly programmes: ProgrammeRepositoryPort,
  ) {}

  @Get('piliers')
  @ApiOperation({ summary: 'Lister les 4 piliers DBC avec leurs programmes' })
  async listerPiliers() {
    const [piliers, programmes] = await Promise.all([this.piliers.listerTous(), this.programmes.listerTous()]);
    return piliers.map((pilier) => ({
      code: pilier.code,
      name: pilier.nom,
      tagline: pilier.tagline,
      programs: programmes
        .filter((programme) => programme.pilierCode === pilier.code)
        .map((programme) => ({ id: programme.id, name: programme.nom, minimumLevelId: programme.niveauMinimumRequisId })),
    }));
  }
}
