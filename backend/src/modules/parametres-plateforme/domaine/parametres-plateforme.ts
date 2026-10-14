/**
 * Réglages de la PLATEFORME choisis par l'administrateur (page "Paramètres")
 * et lus par le reste du site : identité, tontine (jour de cotisation,
 * rappel), sécurité (règle de mot de passe, inactivité), sauvegarde, et qui
 * reçoit quelles notifications. Leur forme est celle de l'interface ; ce
 * fichier fixe les valeurs par défaut et les bornes, et la règle de mot de
 * passe que le serveur RE-VÉRIFIE (un contrôle fait seulement dans le
 * navigateur ne protège rien).
 */
export interface ParametresPlateforme {
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    timezone: string;
    defaultLanguage: string;
    currency: string;
    dateFormat: string;
  };
  tontine: { cycleDurationMonths: number; contributionDay: number; reminderDaysBefore: number };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: string;
    passwordMinLength: number;
    passwordRequireUpper: boolean;
    passwordRequireDigit: boolean;
    passwordRequireSymbol: boolean;
    memberIdleMinutes: number;
  };
  backup: { autoExportEnabled: boolean; exportFrequency: string };
  notificationsEnabled: boolean;
  /** { typeDeNotification: { membres, directeurs, leaders, admins } } */
  notificationMatrix: Record<string, Record<string, boolean>>;
}

/** Jamais moins de 8 caractères : un mot de passe plus court se devine trop vite. */
export const BORNES_LONGUEUR_MOT_DE_PASSE = { min: 8, max: 32 };
const MINUTES_INACTIVITE = [5, 10, 15, 30];
const AUDIENCES = ['membres', 'directeurs', 'leaders', 'admins'];

export const PARAMETRES_PAR_DEFAUT: ParametresPlateforme = {
  general: {
    platformName: 'Les Déployés Business Community',
    supportEmail: 'contact@dbc-afrique.com',
    supportPhone: '+237 6 00 00 00 00',
    timezone: 'douala',
    defaultLanguage: 'fr',
    currency: 'xaf',
    dateFormat: 'dmy',
  },
  tontine: { cycleDurationMonths: 12, contributionDay: 5, reminderDaysBefore: 3 },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: '30',
    passwordMinLength: 8,
    passwordRequireUpper: false,
    passwordRequireDigit: true,
    passwordRequireSymbol: false,
    memberIdleMinutes: 5,
  },
  backup: { autoExportEnabled: true, exportFrequency: 'monthly' },
  notificationsEnabled: true,
  notificationMatrix: {
    cotisationRecue: { membres: true, directeurs: false, leaders: false, admins: true },
    rappelEcheance: { membres: true, directeurs: false, leaders: false, admins: false },
    tourAttribue: { membres: true, directeurs: false, leaders: true, admins: true },
    nouveauMembre: { membres: false, directeurs: true, leaders: true, admins: true },
    nouvelleFormation: { membres: true, directeurs: false, leaders: false, admins: false },
    rappelFormation: { membres: true, directeurs: false, leaders: false, admins: false },
    changementNiveau: { membres: true, directeurs: false, leaders: true, admins: false },
    annonceGouvernance: { membres: false, directeurs: true, leaders: true, admins: true },
    rencontre: { membres: true, directeurs: false, leaders: true, admins: false },
    coinsGagnes: { membres: true, directeurs: false, leaders: false, admins: false },
    nouveauFilleul: { membres: true, directeurs: false, leaders: false, admins: false },
  },
};

type Brut = Record<string, unknown> | undefined;

const objet = (valeur: unknown): Brut =>
  valeur && typeof valeur === 'object' && !Array.isArray(valeur) ? (valeur as Record<string, unknown>) : undefined;
const texte = (valeur: unknown, defaut: string) => (typeof valeur === 'string' ? valeur.trim().slice(0, 200) : defaut);
const booleen = (valeur: unknown, defaut: boolean) => (typeof valeur === 'boolean' ? valeur : defaut);
const entier = (valeur: unknown, defaut: number, min: number, max: number) => {
  const nombre = Math.round(Number(valeur));
  return Number.isFinite(nombre) ? Math.min(max, Math.max(min, nombre)) : defaut;
};

/**
 * Complète des réglages reçus (ou enregistrés par une version précédente)
 * avec les valeurs par défaut, ne garde que les champs connus et ramène
 * chaque valeur dans ses bornes.
 */
export function normaliserParametres(brut: unknown): ParametresPlateforme {
  const d = PARAMETRES_PAR_DEFAUT;
  const racine = objet(brut) ?? {};
  const general = objet(racine.general) ?? {};
  const tontine = objet(racine.tontine) ?? {};
  const securite = objet(racine.security) ?? {};
  const sauvegarde = objet(racine.backup) ?? {};
  const matrice = objet(racine.notificationMatrix) ?? {};

  const minutes = Number(securite.memberIdleMinutes);
  return {
    general: {
      platformName: texte(general.platformName, d.general.platformName),
      supportEmail: texte(general.supportEmail, d.general.supportEmail),
      supportPhone: texte(general.supportPhone, d.general.supportPhone),
      timezone: texte(general.timezone, d.general.timezone),
      defaultLanguage: texte(general.defaultLanguage, d.general.defaultLanguage),
      currency: texte(general.currency, d.general.currency),
      dateFormat: texte(general.dateFormat, d.general.dateFormat),
    },
    tontine: {
      cycleDurationMonths: entier(tontine.cycleDurationMonths, d.tontine.cycleDurationMonths, 1, 36),
      contributionDay: entier(tontine.contributionDay, d.tontine.contributionDay, 1, 28),
      reminderDaysBefore: entier(tontine.reminderDaysBefore, d.tontine.reminderDaysBefore, 0, 31),
    },
    security: {
      twoFactorEnabled: booleen(securite.twoFactorEnabled, d.security.twoFactorEnabled),
      sessionTimeout: texte(securite.sessionTimeout, d.security.sessionTimeout),
      passwordMinLength: entier(
        securite.passwordMinLength,
        d.security.passwordMinLength,
        BORNES_LONGUEUR_MOT_DE_PASSE.min,
        BORNES_LONGUEUR_MOT_DE_PASSE.max,
      ),
      passwordRequireUpper: booleen(securite.passwordRequireUpper, d.security.passwordRequireUpper),
      passwordRequireDigit: booleen(securite.passwordRequireDigit, d.security.passwordRequireDigit),
      passwordRequireSymbol: booleen(securite.passwordRequireSymbol, d.security.passwordRequireSymbol),
      memberIdleMinutes: MINUTES_INACTIVITE.includes(minutes) ? minutes : d.security.memberIdleMinutes,
    },
    backup: {
      autoExportEnabled: booleen(sauvegarde.autoExportEnabled, d.backup.autoExportEnabled),
      exportFrequency: texte(sauvegarde.exportFrequency, d.backup.exportFrequency),
    },
    notificationsEnabled: booleen(racine.notificationsEnabled, d.notificationsEnabled),
    notificationMatrix: Object.fromEntries(
      Object.entries(d.notificationMatrix).map(([type, parDefaut]) => {
        const ligne = objet(matrice[type]) ?? {};
        return [type, Object.fromEntries(AUDIENCES.map((a) => [a, booleen(ligne[a], parDefaut[a])]))];
      }),
    ),
  };
}

/** Raison du refus d'un mot de passe selon la règle de la plateforme, ou null s'il la respecte. */
export function verifierMotDePasse(motDePasse: string, securite: ParametresPlateforme['security']): string | null {
  if (motDePasse.length < securite.passwordMinLength) {
    return `Le mot de passe doit contenir au moins ${securite.passwordMinLength} caractères`;
  }
  if (!/[A-Za-z]/.test(motDePasse)) return 'Le mot de passe doit contenir au moins une lettre';
  if (securite.passwordRequireUpper && !/[A-Z]/.test(motDePasse)) {
    return 'Le mot de passe doit contenir au moins une majuscule';
  }
  if (securite.passwordRequireDigit && !/[0-9]/.test(motDePasse)) {
    return 'Le mot de passe doit contenir au moins un chiffre';
  }
  if (securite.passwordRequireSymbol && !/[^A-Za-z0-9]/.test(motDePasse)) {
    return 'Le mot de passe doit contenir au moins un symbole';
  }
  return null;
}
