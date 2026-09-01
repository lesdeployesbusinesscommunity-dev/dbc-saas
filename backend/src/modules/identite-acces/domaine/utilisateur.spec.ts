import { Utilisateur } from './utilisateur';

describe('Utilisateur (domaine)', () => {
  it('refuse un téléphone invalide', () => {
    const resultat = Utilisateur.creer({ telephone: 'abc', motDePasseHache: 'x' });
    expect(resultat.succes).toBe(false);
  });

  it('crée un utilisateur en_attente par défaut', () => {
    const resultat = Utilisateur.creer({ telephone: '+237600000000', motDePasseHache: 'x' });
    expect(resultat.succes).toBe(true);
    expect(resultat.valeur?.statut).toBe('en_attente');
  });

  it('ne peut pas être activé deux fois', () => {
    const utilisateur = Utilisateur.creer({
      telephone: '+237600000000',
      motDePasseHache: 'x',
    }).valeur!;
    utilisateur.activerApresVerification();
    const deuxiemeActivation = utilisateur.activerApresVerification();
    expect(deuxiemeActivation.succes).toBe(false);
  });
});
