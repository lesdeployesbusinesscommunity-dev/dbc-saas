import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './interface/contact.controller';
import { EnvoyerMessageContactUseCase } from './application/envoyer-message-contact.use-case';
import { MessageContactRepositoryPort } from './domaine/message-contact.repository.port';
import { MessageContactOrmEntity } from './infrastructure/message-contact.orm-entity';
import { MessageContactPostgresRepository } from './infrastructure/message-contact.postgres.repository';

/**
 * Module Contact — formulaire de contact public (page Contacts du
 * frontend). N'est pas l'un des 10 modules du cahier de conception, ajouté
 * pour que la partie visiteur du site soit complètement fonctionnelle.
 */
@Module({
  imports: [TypeOrmModule.forFeature([MessageContactOrmEntity])],
  controllers: [ContactController],
  providers: [
    EnvoyerMessageContactUseCase,
    { provide: MessageContactRepositoryPort, useClass: MessageContactPostgresRepository },
  ],
})
export class ContactModule {}
