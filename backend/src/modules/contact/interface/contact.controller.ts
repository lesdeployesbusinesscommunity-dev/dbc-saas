import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EnvoyerMessageContactUseCase } from '../application/envoyer-message-contact.use-case';
import { EnvoyerMessageContactDto } from './dto/envoyer-message-contact.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly envoyerMessage: EnvoyerMessageContactUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message via le formulaire de contact public' })
  @ApiResponse({ status: 201, description: 'Message enregistré' })
  async envoyer(@Body() dto: EnvoyerMessageContactDto) {
    const message = await this.envoyerMessage.executer({
      nom: dto.name,
      email: dto.email,
      telephone: dto.phone,
      sujet: dto.subject,
      message: dto.message,
    });
    return { id: message.id };
  }
}
