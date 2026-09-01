import { Body, Controller, Post } from '@nestjs/common';
import { InscrireUtilisateurUseCase } from '../application/inscrire-utilisateur.use-case';
import { InscriptionDto } from './dto/inscription.dto';

// Hachage réel (argon2/bcrypt) à brancher lors de l'intégration Postgres —
// volontairement absent ici pour ne pas alourdir le premier déploiement.
function hacherMotDePasseTemporaire(motDePasse: string): string {
  return `hache::${motDePasse}`;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly inscrireUtilisateur: InscrireUtilisateurUseCase) {}

  @Post('register')
  async sInscrire(@Body() dto: InscriptionDto) {
    const utilisateur = await this.inscrireUtilisateur.executer({
      telephone: dto.telephone,
      email: dto.email,
      motDePasseHache: hacherMotDePasseTemporaire(dto.motDePasse),
    });

    return {
      id: utilisateur.id,
      telephone: utilisateur.telephone,
      email: utilisateur.email,
      statut: utilisateur.statut,
    };
  }
}
