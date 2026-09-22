import { BadRequestException, Injectable } from '@nestjs/common';
import { MessageContact } from '../domaine/message-contact';
import { MessageContactRepositoryPort } from '../domaine/message-contact.repository.port';

export interface EnvoyerMessageContactCommande {
  nom: string;
  email: string;
  telephone?: string;
  sujet: string;
  message: string;
}

@Injectable()
export class EnvoyerMessageContactUseCase {
  constructor(private readonly messages: MessageContactRepositoryPort) {}

  async executer(commande: EnvoyerMessageContactCommande): Promise<MessageContact> {
    const resultat = MessageContact.creer(commande);
    if (!resultat.succes) {
      throw new BadRequestException(resultat.erreur);
    }
    return this.messages.sauvegarder(resultat.valeur!);
  }
}
