import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Annonce } from '../domaine/annonce';
import { AnnonceRepositoryPort } from '../domaine/annonce.repository.port';
import { AnnonceOrmEntity } from './annonce.orm-entity';

@Injectable()
export class AnnoncePostgresRepository implements AnnonceRepositoryPort {
  constructor(
    @InjectRepository(AnnonceOrmEntity)
    private readonly repository: Repository<AnnonceOrmEntity>,
  ) {}

  async sauvegarder(annonce: Annonce): Promise<Annonce> {
    const ligne = await this.repository.save({
      id: annonce.id,
      titre: annonce.titre,
      contenu: annonce.contenu,
      auteurId: annonce.auteurId,
      niveauCibleId: annonce.niveauCibleId,
      publieeLe: annonce.publieeLe,
    });
    return Annonce.depuisPersistance(ligne);
  }

  async listerRecentes(limite: number): Promise<Annonce[]> {
    const lignes = await this.repository.find({ order: { publieeLe: 'DESC' }, take: limite });
    return lignes.map((ligne) => Annonce.depuisPersistance(ligne));
  }
}
