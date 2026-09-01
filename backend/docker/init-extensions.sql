-- Exécuté automatiquement à la création du conteneur Postgres.
-- ltree est requis pour l'arbre de parrainage du module Réseau MLM.
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
