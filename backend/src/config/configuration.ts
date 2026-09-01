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
});
