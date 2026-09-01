import { Module } from '@nestjs/common';

/**
 * Module 9 — Communauté et diaspora — squelette du module.
 * Structure à suivre (identique au module Identité & Accès déjà implémenté) :
 *   domaine/        entités métier pures + tests unitaires, zéro dépendance framework
 *   application/    cas d'utilisation (use-cases), orchestration pure
 *   infrastructure/ adaptateurs (Postgres, files d'attente, appels externes)
 *   interface/      contrôleurs REST + DTO
 *
 * Voir le cahier de conception, Module 9 — Communauté et diaspora, pour les cas d'utilisation,
 * le diagramme de classes et les diagrammes d'activité de ce module.
 */
@Module({})
export class CommunauteDiasporaModule {}
