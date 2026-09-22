import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageContact } from '../domaine/message-contact';
import { MessageContactRepositoryPort } from '../domaine/message-contact.repository.port';
import { MessageContactOrmEntity } from './message-contact.orm-entity';

@Injectable()
export class MessageContactPostgresRepository implements MessageContactRepositoryPort {
  constructor(
    @InjectRepository(MessageContactOrmEntity)
    private readonly repository: Repository<MessageContactOrmEntity>,
  ) {}

  async sauvegarder(message: MessageContact): Promise<MessageContact> {
    const ligne = await this.repository.save({
      id: message.id,
      nom: message.nom,
      email: message.email,
      telephone: message.telephone,
      sujet: message.sujet,
      message: message.message,
    });
    return MessageContact.depuisPersistance(ligne);
  }
}
