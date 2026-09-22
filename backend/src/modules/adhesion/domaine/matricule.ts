/**
 * Format DBC-AAAA-XXXXX (cahier des charges, §4.1) : année + numéro séquentiel
 * sur 4 chiffres + 1 chiffre de contrôle Luhn. Fonction pure — le numéro de
 * séquence est fourni par l'appelant (obtenu via une séquence Postgres côté
 * infrastructure, pour garantir l'unicité sans condition de course).
 */
function chiffreLuhn(chiffres: string): number {
  let somme = 0;
  let doubler = true;
  for (let i = chiffres.length - 1; i >= 0; i--) {
    let chiffre = Number(chiffres[i]);
    if (doubler) {
      chiffre *= 2;
      if (chiffre > 9) {
        chiffre -= 9;
      }
    }
    somme += chiffre;
    doubler = !doubler;
  }
  const modulo = somme % 10;
  return modulo === 0 ? 0 : 10 - modulo;
}

export function genererMatricule(annee: number, numeroSequence: number): string {
  const sequence = String(numeroSequence).padStart(4, '0');
  const controle = chiffreLuhn(sequence);
  return `DBC-${annee}-${sequence}${controle}`;
}
