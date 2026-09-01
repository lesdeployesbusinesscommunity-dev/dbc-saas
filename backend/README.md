# DBC Backend

Monolithe modulaire NestJS — architecture hexagonale, un module par bounded context
du cahier de conception.

## Démarrage local

### Sans Docker
```bash
npm install
cp .env.example .env   # ajuster si besoin
npm run start:dev
```
Le serveur démarre sur `http://localhost:3000/api/v1`.
Vérifier : `curl http://localhost:3000/api/v1/health`

### Avec Docker (Postgres + Redis en local)
```bash
docker compose up -d      # lance Postgres (avec l'extension ltree) + Redis
npm install
cp .env.example .env
npm run start:dev
```
Le `.env.example` pointe déjà vers les conteneurs Docker par défaut.

⚠️ Le module Identité utilise pour l'instant un dépôt **en mémoire**
(`utilisateur.en-memoire.repository.ts`) — les données ne sont pas encore
persistées dans Postgres. C'est volontaire pour permettre un premier
déploiement immédiat ; l'adaptateur PostgreSQL réel est la prochaine étape
(voir `src/modules/identite-acces/infrastructure/`).

## Tester

```bash
npm run test        # tests unitaires du domaine (aucune dépendance externe requise)
```

## Déployer rapidement (donner une URL au frontend)

### Railway (recommandé, gratuit pour démarrer)
1. Pousser ce projet sur un dépôt GitHub.
2. Sur [railway.app](https://railway.app) : *New Project* → *Deploy from GitHub repo*.
3. Railway détecte automatiquement le `Dockerfile` et build l'image.
4. Dans l'onglet *Variables*, ajouter au minimum : `JWT_SECRET` (une valeur aléatoire longue).
   `PORT` est fourni automatiquement par Railway — ne pas le fixer en dur.
5. Une fois déployé, Railway donne une URL publique (`https://xxx.up.railway.app`) —
   c'est cette URL que ton collègue frontend utilise pour taper l'API :
   `https://xxx.up.railway.app/api/v1/health` doit répondre `{"statut":"ok",...}`.

### Render (alternative)
Même principe : *New* → *Web Service* → connecter le repo → Render détecte le
`Dockerfile` automatiquement.

### Ajouter Postgres plus tard (quand l'adaptateur sera prêt)
Sur Railway : *New* → *Database* → *PostgreSQL*. La variable `DATABASE_URL`
est injectée automatiquement dans le service backend — il suffira de la lire
depuis `src/config/configuration.ts` (déjà prévu).

## Structure d'un module (à répliquer pour chaque nouveau module)

```
src/modules/<nom-module>/
  domaine/         entités métier pures + tests unitaires (.spec.ts)
  application/     cas d'utilisation (use-cases)
  infrastructure/  adaptateurs (Postgres, files d'attente, APIs externes)
  interface/       DTO (class-validator) + contrôleurs REST
  <nom>.module.ts  assemblage NestJS du module
```

Le module `identite-acces/` est entièrement implémenté et sert de référence.
Les 9 autres modules sont des squelettes (voir leur `README.md` respectif) —
à implémenter dans l'ordre recommandé : Adhésion → Paiements → Tontine → MLM
→ modules support.

## Prochaines étapes techniques

1. Vérifier que `npm install && npm run build && npm test` passe sans erreur
   (non testé dans l'environnement qui a généré ce scaffold — réseau indisponible).
2. Remplacer `UtilisateurEnMemoireRepository` par un vrai adaptateur PostgreSQL
   (TypeORM ou Prisma), en implémentant le même `UtilisateurRepositoryPort`.
3. Mettre en place les migrations versionnées à partir du DDL du cahier de
   conception (module Modèle de données).
4. Ajouter le hachage de mot de passe réel (argon2) à la place de
   `hacherMotDePasseTemporaire`.
