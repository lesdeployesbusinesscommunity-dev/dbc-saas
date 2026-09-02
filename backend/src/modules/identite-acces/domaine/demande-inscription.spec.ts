import { DemandeInscription } from './demande-inscription';

const PARAMS_VALIDES = {
  nom: 'Wakap',
  prenom: 'Hubert',
  age: 30,
  pays: 'Cameroun',
  telephone: '+237600000000',
  niveauSouhaiteCode: 'starter',
};

describe('DemandeInscription (domaine)', () => {
  it('refuse un mineur', () => {
    const resultat = DemandeInscription.creer({ ...PARAMS_VALIDES, age: 16 });
    expect(resultat.succes).toBe(false);
  });

  it('refuse un téléphone invalide', () => {
    const resultat = DemandeInscription.creer({ ...PARAMS_VALIDES, telephone: 'abc' });
    expect(resultat.succes).toBe(false);
  });

  it('crée une demande en_attente par défaut', () => {
    const resultat = DemandeInscription.creer(PARAMS_VALIDES);
    expect(resultat.succes).toBe(true);
    expect(resultat.valeur?.statut).toBe('en_attente');
  });

  it('ne peut pas être validée deux fois', () => {
    const demande = DemandeInscription.creer(PARAMS_VALIDES).valeur!;
    expect(demande.valider('utilisateur-1').succes).toBe(true);
    expect(demande.valider('utilisateur-2').succes).toBe(false);
  });

  it('ne peut pas être rejetée après validation', () => {
    const demande = DemandeInscription.creer(PARAMS_VALIDES).valeur!;
    demande.valider('utilisateur-1');
    expect(demande.rejeter().succes).toBe(false);
  });
});
