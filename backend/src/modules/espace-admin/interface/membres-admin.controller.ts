import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FicheMembreAdmin, MembresAdminService } from '../application/membres-admin.service';
import { CreerMembreParAdminUseCase } from '../application/creer-membre-par-admin.use-case';
import { ModifierMembreParAdminUseCase } from '../application/modifier-membre-par-admin.use-case';
import { SupprimerMembreParAdminUseCase } from '../application/supprimer-membre-par-admin.use-case';
import { CreerMembreAdminDto, ModifierMembreAdminDto } from './dto/membre-admin.dto';
import { FicheMembre } from '../../espace-membre/application/annuaire-membres.service';
import { AdminSecretGuard } from '../../../commun/gardes/admin-secret.guard';

const STATUT_AFFICHE: Record<string, string> = { actif: 'actif', en_attente: 'attente', suspendu: 'desactive' };

function versReponseLien(fiche: FicheMembre) {
  return { id: fiche.id, name: fiche.nom, membershipNumber: fiche.matricule, city: fiche.ville };
}

function versReponseMembre(m: FicheMembreAdmin) {
  return {
    id: m.fiche.id,
    membershipNumber: m.fiche.matricule,
    name: m.fiche.nom,
    firstName: m.prenom,
    lastName: m.nomDeFamille,
    title: m.titre,
    phoneNumber: m.fiche.telephone,
    email: m.email,
    country: m.fiche.pays,
    city: m.fiche.ville,
    profession: m.fiche.profession,
    photoUrl: m.fiche.photoUrl,
    isAdmin: m.fiche.estAdmin,
    status: STATUT_AFFICHE[m.fiche.statut] ?? m.fiche.statut,
    levelCode: m.fiche.niveauCode,
    coins: m.fiche.coins,
    joinedAt: m.fiche.membreDepuis,
    sponsor: m.parrain ? versReponseLien(m.parrain) : null,
    sponsoredMembers: m.filleuls.map(versReponseLien),
    referralEarnings: m.gainsParrainage,
    contributed: m.totalVerse,
    trainingsCompleted: m.formationsTerminees,
    trainingInProgress: m.formationEnCours,
    nextTontineDate: m.prochaineEcheanceTontine,
    awards: m.distinctions,
  };
}

/**
 * "Gestion des membres" (administrateur) : la liste détaillée des membres, et
 * l'ajout, la mise à jour, la désactivation ou la suppression d'un membre.
 */
@ApiTags('membres')
@ApiBearerAuth()
@ApiHeader({ name: 'x-admin-secret', required: false })
@UseGuards(AdminSecretGuard)
@Controller('membres')
export class MembresAdminController {
  constructor(
    private readonly membres: MembresAdminService,
    private readonly creerMembre: CreerMembreParAdminUseCase,
    private readonly modifierMembre: ModifierMembreParAdminUseCase,
    private readonly supprimerMembre: SupprimerMembreParAdminUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les membres avec leur fiche complète (admin)' })
  async lister() {
    return (await this.membres.lister()).map(versReponseMembre);
  }

  @Post()
  @ApiOperation({ summary: 'Inscrire directement un membre (admin) — matricule attribué automatiquement' })
  async creer(@Body() dto: CreerMembreAdminDto) {
    const membre = await this.creerMembre.executer({
      telephone: dto.phoneNumber,
      email: dto.email,
      motDePasseTemporaire: dto.temporaryPassword,
      codeNiveau: dto.levelCode,
      matriculeParrain: dto.sponsorMembershipNumber?.trim().toUpperCase() || undefined,
      profil: {
        prenom: dto.firstName,
        nom: dto.lastName,
        titre: dto.title,
        profession: dto.profession,
        ville: dto.city,
        pays: dto.country,
      },
    });
    return this.fiche(membre.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour, désactiver ou réactiver un membre (admin)' })
  async modifier(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ModifierMembreAdminDto) {
    await this.modifierMembre.executer({
      membreId: id,
      email: dto.email,
      codeNiveau: dto.levelCode,
      statut: dto.status,
      soldeCoins: dto.coins,
      profil: {
        prenom: dto.firstName,
        nom: dto.lastName,
        titre: dto.title,
        profession: dto.profession,
        ville: dto.city,
        pays: dto.country,
      },
    });
    return this.fiche(id);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Supprimer un membre (admin) — compte fermé, historique conservé' })
  async supprimer(@Param('id', ParseUUIDPipe) id: string) {
    await this.supprimerMembre.executer(id);
    return { deleted: true };
  }

  private async fiche(id: string) {
    const fiche = (await this.membres.lister()).find((m) => m.fiche.id === id);
    return fiche ? versReponseMembre(fiche) : null;
  }
}
