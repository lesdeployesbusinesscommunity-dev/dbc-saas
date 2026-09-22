import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeOtp } from '../domaine/code-otp';
import { CodeOtpRepositoryPort } from '../domaine/code-otp.repository.port';
import { CodeOtpOrmEntity } from './code-otp.orm-entity';

@Injectable()
export class CodeOtpPostgresRepository implements CodeOtpRepositoryPort {
  constructor(
    @InjectRepository(CodeOtpOrmEntity)
    private readonly repository: Repository<CodeOtpOrmEntity>,
  ) {}

  async sauvegarder(code: CodeOtp): Promise<CodeOtp> {
    const ligne = await this.repository.save({
      id: code.id,
      utilisateurId: code.utilisateurId,
      codeHache: code.codeHache,
      expireLe: code.expireLe,
      tentatives: code.tentatives,
      consomme: code.consomme,
    });
    return this.versDomaine(ligne);
  }

  async trouverParId(id: string): Promise<CodeOtp | null> {
    const ligne = await this.repository.findOne({ where: { id } });
    return ligne ? this.versDomaine(ligne) : null;
  }

  private versDomaine(ligne: CodeOtpOrmEntity): CodeOtp {
    return CodeOtp.depuisPersistance({
      id: ligne.id,
      utilisateurId: ligne.utilisateurId,
      codeHache: ligne.codeHache,
      expireLe: ligne.expireLe,
      tentatives: ligne.tentatives,
      consomme: ligne.consomme,
    });
  }
}
