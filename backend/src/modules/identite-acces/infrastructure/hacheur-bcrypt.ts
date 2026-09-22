import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HacheurMotDePassePort } from '../domaine/hacheur-mot-de-passe.port';

const NOMBRE_TOURS_SEL = 12;

@Injectable()
export class HacheurBcrypt implements HacheurMotDePassePort {
  async hacher(motDePasseClair: string): Promise<string> {
    return bcrypt.hash(motDePasseClair, NOMBRE_TOURS_SEL);
  }

  async verifier(motDePasseClair: string, hache: string): Promise<boolean> {
    return bcrypt.compare(motDePasseClair, hache);
  }
}
