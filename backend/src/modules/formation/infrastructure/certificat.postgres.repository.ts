import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificat } from '../domaine/certificat';
import { CertificatRepositoryPort } from '../domaine/certificat.repository.port';
import { CertificatOrmEntity } from './certificat.orm-entity';

@Injectable()
export class CertificatPostgresRepository implements CertificatRepositoryPort {
  constructor(
    @InjectRepository(CertificatOrmEntity)
    private readonly repository: Repository<CertificatOrmEntity>,
  ) {}

  async sauvegarder(certificat: Certificat): Promise<Certificat> {
    const ligne = await this.repository.save({
      id: certificat.id,
      inscriptionId: certificat.inscriptionId,
      codeVerification: certificat.codeVerification,
      delivreLe: certificat.delivreLe,
    });
    return this.versDomaine(ligne);
  }

  async trouverParInscriptionId(inscriptionId: string): Promise<Certificat | null> {
    const ligne = await this.repository.findOne({ where: { inscriptionId } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  async trouverParCodeVerification(codeVerification: string): Promise<Certificat | null> {
    const ligne = await this.repository.findOne({ where: { codeVerification } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: CertificatOrmEntity): Certificat {
    return Certificat.depuisPersistance({
      id: ligne.id,
      inscriptionId: ligne.inscriptionId,
      codeVerification: ligne.codeVerification,
      delivreLe: ligne.delivreLe,
    });
  }
}
