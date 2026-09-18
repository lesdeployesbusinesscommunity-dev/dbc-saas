// ----------------------------------------------------------------------
// Données de démonstration pour "Paramètres" (/admin/parametres). Comme
// pour le reste de l'admin, tout est géré en local pour l'instant (voir
// Parametres/index.jsx) — rien n'est envoyé au backend en attendant les
// vrais endpoints.

// Réglages généraux de la plateforme — identité + préférences
// régionales, ce qu'on retrouve dans la quasi-totalité des pages
// "Paramètres système" d'un site d'administration.
export const initialGeneralSettings = {
  platformName: "Les Déployés Business Community",
  supportEmail: "contact@dbc-afrique.com",
  supportPhone: "+237 6 00 00 00 00",
  timezone: "douala",
  defaultLanguage: "fr",
  currency: "xaf",
  dateFormat: "dmy",
};

// Réglages propres au cycle de tontine — fait écho au "Tour 7/12" déjà
// affiché sur la page Finance (même durée de cycle par défaut).
export const initialTontineSettings = {
  cycleDurationMonths: 12,
  contributionDay: 5,
  reminderDaysBefore: 3,
};

export const initialSecuritySettings = {
  twoFactorEnabled: false,
  sessionTimeout: "30",
  passwordPolicy: "standard",
};

export const initialBackupSettings = {
  autoExportEnabled: true,
  exportFrequency: "monthly",
};

// "Qui" peut recevoir une notification — s'appuie sur les mêmes rôles
// déjà présents dans Gestion de la gouvernance (Comité Exécutif, Leaders
// d'Antennes) plutôt que d'inventer une nouvelle liste de rôles.
export const notificationAudiences = [
  { key: "membres", labelKey: "admin.parametres.notifications.audiences.membres" },
  { key: "directeurs", labelKey: "admin.parametres.notifications.audiences.directeurs" },
  { key: "leaders", labelKey: "admin.parametres.notifications.audiences.leaders" },
  { key: "admins", labelKey: "admin.parametres.notifications.audiences.admins" },
];

// "À propos de quoi" — les événements de la plateforme qui peuvent
// déclencher une notification.
export const notificationTypes = [
  { key: "cotisationRecue", labelKey: "admin.parametres.notifications.types.cotisationRecue" },
  { key: "rappelEcheance", labelKey: "admin.parametres.notifications.types.rappelEcheance" },
  { key: "tourAttribue", labelKey: "admin.parametres.notifications.types.tourAttribue" },
  { key: "nouveauMembre", labelKey: "admin.parametres.notifications.types.nouveauMembre" },
  { key: "nouvelleFormation", labelKey: "admin.parametres.notifications.types.nouvelleFormation" },
  { key: "rappelFormation", labelKey: "admin.parametres.notifications.types.rappelFormation" },
  { key: "changementNiveau", labelKey: "admin.parametres.notifications.types.changementNiveau" },
  { key: "annonceGouvernance", labelKey: "admin.parametres.notifications.types.annonceGouvernance" },
];

// Qui reçoit quoi par défaut — un mélange volontairement varié (pas tout
// coché, pas tout décoché) pour que la matrice soit lisible dès l'ouverture
// de la page.
export const initialNotificationMatrix = {
  cotisationRecue: { membres: true, directeurs: false, leaders: false, admins: true },
  rappelEcheance: { membres: true, directeurs: false, leaders: false, admins: false },
  tourAttribue: { membres: true, directeurs: false, leaders: true, admins: true },
  nouveauMembre: { membres: false, directeurs: true, leaders: true, admins: true },
  nouvelleFormation: { membres: true, directeurs: false, leaders: false, admins: false },
  rappelFormation: { membres: true, directeurs: false, leaders: false, admins: false },
  changementNiveau: { membres: true, directeurs: false, leaders: true, admins: false },
  annonceGouvernance: { membres: false, directeurs: true, leaders: true, admins: true },
};

export const initialNotificationsEnabled = true;

export const timezoneOptions = [
  { value: "douala", labelKey: "admin.parametres.general.timezoneOptions.douala" },
  { value: "dakar", labelKey: "admin.parametres.general.timezoneOptions.dakar" },
  { value: "nairobi", labelKey: "admin.parametres.general.timezoneOptions.nairobi" },
  { value: "paris", labelKey: "admin.parametres.general.timezoneOptions.paris" },
];

export const languageOptions = [
  { value: "fr", labelKey: "admin.parametres.general.languageOptions.fr" },
  { value: "en", labelKey: "admin.parametres.general.languageOptions.en" },
];

export const currencyOptions = [
  { value: "xaf", labelKey: "admin.parametres.general.currencyOptions.xaf" },
  { value: "ghs", labelKey: "admin.parametres.general.currencyOptions.ghs" },
  { value: "ngn", labelKey: "admin.parametres.general.currencyOptions.ngn" },
  { value: "usd", labelKey: "admin.parametres.general.currencyOptions.usd" },
];

export const dateFormatOptions = [
  { value: "dmy", labelKey: "admin.parametres.general.dateFormatOptions.dmy" },
  { value: "mdy", labelKey: "admin.parametres.general.dateFormatOptions.mdy" },
  { value: "ymd", labelKey: "admin.parametres.general.dateFormatOptions.ymd" },
];

export const sessionTimeoutOptions = [
  { value: "15", labelKey: "admin.parametres.security.sessionTimeoutOptions.15" },
  { value: "30", labelKey: "admin.parametres.security.sessionTimeoutOptions.30" },
  { value: "60", labelKey: "admin.parametres.security.sessionTimeoutOptions.60" },
  { value: "240", labelKey: "admin.parametres.security.sessionTimeoutOptions.240" },
  { value: "480", labelKey: "admin.parametres.security.sessionTimeoutOptions.480" },
];

export const passwordPolicyOptions = [
  { value: "standard", labelKey: "admin.parametres.security.passwordPolicyOptions.standard" },
  { value: "renforcee", labelKey: "admin.parametres.security.passwordPolicyOptions.renforcee" },
];

export const exportFrequencyOptions = [
  { value: "daily", labelKey: "admin.parametres.backup.exportFrequencyOptions.daily" },
  { value: "weekly", labelKey: "admin.parametres.backup.exportFrequencyOptions.weekly" },
  { value: "monthly", labelKey: "admin.parametres.backup.exportFrequencyOptions.monthly" },
];
