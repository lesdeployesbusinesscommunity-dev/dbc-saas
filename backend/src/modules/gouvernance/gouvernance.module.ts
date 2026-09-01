import { Module } from '@nestjs/common';

/**
 * Module 10 — Gouvernance et administration — squelette du module.
 * Structure à suivre (identique au module Identité & Accès déjà implémenté) :
 *   domaine/        entités métier pures + tests unitaires, zéro dépendance framework
 *   application/    cas d'utilisation (use-cases), orchestration pure
 *   infrastructure/ adaptateurs (Postgres, files d'attente, appels externes)
 *   interface/      contrôleurs REST + DTO
 *
 * Voir le cahier de conception, Module 10 — Gouvernance et administration, pour les cas d'utilisation,
 * le diagramme de classes et les diagrammes d'activité de ce module.
 */
@Module({})
export class GouvernanceModule {}
