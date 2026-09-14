// Point d'entrée unique de la configuration — jamais de process.env dispersé dans le code métier.
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  environnement: process.env.NODE_ENV ?? 'development',
  baseDeDonnees: {
    url: process.env.DATABASE_URL, // absent au premier déploiement — voir README
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
  },
  app: {
    // Sert à construire l'URL publique de vérification encodée dans le QR code des certificats.
    baseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  },
});
