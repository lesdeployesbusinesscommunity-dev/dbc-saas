import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretDoubleAuthentification } from '../domaine/secret-double-authentification';
import { SecretDoubleAuthentificationRepositoryPort } from '../domaine/secret-double-authentification.repository.port';
import { SecretDoubleAuthentificationOrmEntity } from './secret-double-authentification.orm-entity';

@Injectable()
export class SecretDoubleAuthentificationPostgresRepository implements SecretDoubleAuthentificationRepositoryPort {
  constructor(
    @InjectRepository(SecretDoubleAuthentificationOrmEntity)
    private readonly repository: Repository<SecretDoubleAuthentificationOrmEntity>,
  ) {}

  async sauvegarder(secret: SecretDoubleAuthentification): Promise<SecretDoubleAuthentification> {
    const ligne = await this.repository.save({
      id: secret.id,
      utilisateurId: secret.utilisateurId,
      actif: secret.actif,
    });
    return this.versDomaine(ligne);
  }

  async trouverParUtilisateurId(utilisateurId: string): Promise<SecretDoubleAuthentification | null> {
    const ligne = await this.repository.findOne({ where: { utilisateurId } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: SecretDoubleAuthentificationOrmEntity): SecretDoubleAuthentification {
    return SecretDoubleAuthentification.depuisPersistance({
      id: ligne.id,
      utilisateurId: ligne.utilisateurId,
      actif: ligne.actif,
    });
  }
}
