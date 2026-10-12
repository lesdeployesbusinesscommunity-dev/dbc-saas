import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Formation } from '../domaine/formation';
import { FormationRepositoryPort } from '../domaine/formation.repository.port';
import { Inscription } from '../domaine/inscription';
import { InscriptionRepositoryPort } from '../domaine/inscription.repository.port';
import { Lecon } from '../domaine/lecon';
import { LeconRepositoryPort } from '../domaine/lecon.repository.port';
import { ModuleFormationRepositoryPort } from '../domaine/module-formation.repository.port';
import { ProgressionLecon } from '../domaine/progression-lecon';
import { ProgressionLeconRepositoryPort } from '../domaine/progression-lecon.repository.port';
import { Certificat } from '../domaine/certificat';
import { CertificatRepositoryPort } from '../domaine/certificat.repository.port';
import { MembreRepositoryPort } from '../../adhesion/domaine/membre.repository.port';
import { ReclamerGainCoinsUseCase } from '../../gamification/application/reclamer-gain-coins.use-case';

export interface LeconEtFormation {
  lecon: Lecon;
  formation: Formation;
}

/**
 * Règles communes du suivi d'une formation par un membre (cas d'utilisation
 * 7.1 et 7.2) :
 * - l'inscription se fait d'elle-même à la première leçon ouverte, si le
 *   niveau DBC du membre le permet ;
 * - le contenu reste fermé tant que le quiz de pré-requis (s'il existe)
 *   n'est pas réussi ;
 * - la formation est TERMINÉE quand toutes ses leçons le sont (vidéos et PDF
 *   ouverts, quiz réussis) : le certificat est alors délivré et les Coins de
 *   la formation crédités, une seule fois.
 */
@Injectable()
export class ProgressionFormationService {
  constructor(
    private readonly formations: FormationRepositoryPort,
    private readonly modules: ModuleFormationRepositoryPort,
    private readonly lecons: LeconRepositoryPort,
    private readonly inscriptions: InscriptionRepositoryPort,
    private readonly progressions: ProgressionLeconRepositoryPort,
    private readonly certificats: CertificatRepositoryPort,
    private readonly membres: MembreRepositoryPort,
    private readonly reclamerGainCoins: ReclamerGainCoinsUseCase,
  ) {}

  async trouverFormation(formationId: string): Promise<Formation> {
    const formation = await this.formations.trouverParId(formationId);
    if (!formation) {
      throw new NotFoundException('Formation introuvable');
    }
    return formation;
  }

  async trouverLecon(leconId: string): Promise<LeconEtFormation> {
    const lecon = await this.lecons.trouverParId(leconId);
    const moduleFormation = lecon ? await this.modules.trouverParId(lecon.moduleFormationId) : null;
    if (!lecon || !moduleFormation) {
      throw new NotFoundException('Leçon introuvable');
    }
    return { lecon, formation: await this.trouverFormation(moduleFormation.formationId) };
  }

  /** L'inscription du membre à la formation, créée au besoin si son niveau le permet. */
  async inscription(membreId: string, formation: Formation): Promise<Inscription> {
    const existante = await this.inscriptions.trouverParMembreEtFormation(membreId, formation.id!);
    if (existante) {
      return existante;
    }
    const membre = await this.membres.trouverParId(membreId);
    if (!membre) {
      throw new NotFoundException('Membre introuvable');
    }
    // Les niveaux sont semés dans l'ordre (id croissant = rang croissant) — voir AdhesionBootstrap.
    if (membre.niveauActuelId < formation.niveauRequisId) {
      throw new ForbiddenException('Niveau DBC insuffisant pour cette formation');
    }
    return this.inscriptions.sauvegarder(Inscription.creer({ membreId, formationId: formation.id! }));
  }

  exigerPrerequis(formation: Formation, inscription: Inscription): void {
    if (formation.fiche.quizPrerequis && !inscription.prerequis.reussi) {
      throw new BadRequestException('Réussis d’abord le quiz de pré-requis de cette formation');
    }
  }

  async progression(inscription: Inscription, lecon: Lecon): Promise<ProgressionLecon> {
    return (
      (await this.progressions.trouverParInscriptionEtLecon(inscription.id!, lecon.id!)) ??
      ProgressionLecon.creer({ inscriptionId: inscription.id!, leconId: lecon.id! })
    );
  }

  /** Toutes les leçons de la formation, dans l'ordre des chapitres puis des leçons. */
  async leconsDe(formationId: string): Promise<Lecon[]> {
    const chapitres = (await this.modules.listerParFormationId(formationId)).sort((a, b) => a.ordre - b.ordre);
    const lecons: Lecon[] = [];
    for (const chapitre of chapitres) {
      lecons.push(...(await this.lecons.listerParModuleId(chapitre.id!)).sort((a, b) => a.ordre - b.ordre));
    }
    return lecons;
  }

  /** Termine la formation si toutes ses leçons le sont. Renvoie vrai si elle vient de l'être. */
  async verifierAchevement(inscription: Inscription, formation: Formation): Promise<boolean> {
    if (inscription.statut === 'terminee') {
      return false;
    }
    const lecons = await this.leconsDe(formation.id!);
    if (lecons.length === 0) {
      return false;
    }
    const terminees = new Set(
      (await this.progressions.listerParInscriptionId(inscription.id!)).filter((p) => p.terminee).map((p) => p.leconId),
    );
    if (!lecons.every((lecon) => terminees.has(lecon.id!))) {
      return false;
    }

    inscription.marquerTerminee();
    await this.inscriptions.sauvegarder(inscription);
    if (!(await this.certificats.trouverParInscriptionId(inscription.id!))) {
      await this.certificats.sauvegarder(Certificat.creer({ inscriptionId: inscription.id!, codeVerification: randomUUID() }));
    }
    // Coins fixés sur la formation par l'admin ; à défaut, la valeur du
    // catalogue d'actions ("formation_completee").
    await this.reclamerGainCoins.executer({
      membreId: inscription.membreId,
      codeAction: 'formation_completee',
      cleIdempotence: `formation_completee:${inscription.id}`,
      libelle: `Formation : ${formation.titre}`,
      valeurCoins: formation.fiche.coinsRecompense > 0 ? formation.fiche.coinsRecompense : undefined,
    });
    return true;
  }
}
