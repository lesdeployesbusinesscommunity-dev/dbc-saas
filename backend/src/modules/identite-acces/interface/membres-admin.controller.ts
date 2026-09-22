import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListerMembresAdminUseCase } from '../application/lister-membres-admin.use-case';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

@ApiTags('membres')
@Controller('membres')
export class MembresAdminController {
  constructor(private readonly listerMembresAdmin: ListerMembresAdminUseCase) {}

  @Get()
  @UseGuards(AdminSecretGuard)
  @ApiHeader({ name: 'x-admin-secret', required: true })
  @ApiOperation({ summary: 'Lister tous les membres validés (admin)' })
  async lister() {
    return this.listerMembresAdmin.executer();
  }
}
