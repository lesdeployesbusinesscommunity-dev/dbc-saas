import { MessageContact } from './message-contact';

export abstract class MessageContactRepositoryPort {
  abstract sauvegarder(message: MessageContact): Promise<MessageContact>;
}
