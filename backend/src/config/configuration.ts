// Point d'entrée unique de la configuration — jamais de process.env dispersé dans le code métier.
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  environnement: process.env.NODE_ENV ?? 'development',
  baseDeDonnees: {
    url: process.env.DATABASE_URL, // absent au premier déploiement — voir README
    // Création/mise à jour automatique des tables (TypeORM synchronize). Active
    // par défaut hors production ; DB_SYNCHRONIZE=true la force en production
    // tant qu'il n'existe pas de migrations (voir app.module.ts).
    synchroniser:
      process.env.DB_SYNCHRONIZE !== undefined
        ? process.env.DB_SYNCHRONIZE === 'true'
        : (process.env.NODE_ENV ?? 'development') !== 'production',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-moi-en-production',
    dureeAcces: '15m',
    dureeRefresh: '30d',
  },
  paiements: {
    // Partagé avec le fournisseur Mobile Money pour authentifier ses webhooks.
    webhookSecret: process.env.PAIEMENTS_WEBHOOK_SECRET ?? 'change-moi-en-production',
  },
  admin: {
    // Temporaire (voir AdminSecretGuard) en attendant de vrais rôles.
    secret: process.env.ADMIN_SECRET ?? 'change-moi-en-production',
    // Numéros (format international, séparés par des virgules) des comptes
    // promus administrateurs à leur prochaine connexion — voir ConnecterUtilisateurUseCase.
    telephones: (process.env.ADMIN_TELEPHONES ?? '')
      .split(',')
      .map((telephone) => telephone.trim())
      .filter((telephone) => telephone !== ''),
  },
  app: {
    // Sert à construire l'URL publique de vérification encodée dans le QR code des certificats.
    baseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  },
  fichiers: {
    // Cloudflare R2 (voir StockageFichiersR2) : actif seulement si toutes les
    // variables sont définies, sinon les fichiers restent sur le disque du serveur.
    r2:
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL
        ? {
            compte: process.env.R2_ACCOUNT_ID,
            cleAcces: process.env.R2_ACCESS_KEY_ID,
            cleSecrete: process.env.R2_SECRET_ACCESS_KEY,
            bucket: process.env.R2_BUCKET,
            urlPublique: process.env.R2_PUBLIC_URL,
          }
        : undefined,
  },
});
