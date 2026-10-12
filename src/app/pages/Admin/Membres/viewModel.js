// ----------------------------------------------------------------------
// Adaptation d'un MembreAdmin (voir backend ListerMembresAdminUseCase, GET
// /membres) vers la forme attendue par les composants déjà construits pour
// l'admin (MembersTable, MemberDetailsCard, TopMembers, MemberSearchModal,
// PoleSection...) — partagé entre Gestion des membres, de la gouvernance et
// du réseau plutôt que dupliqué dans chaque page.

// Le "code" niveau renvoyé par le backend (level.code — voir GET
// /adhesion/niveaux) est en snake_case pour 2 niveaux sur 8
// ("batisseur_pro", "performer_pro"), alors que le "key" côté frontend
// (Simulateur/data.js, utilisé par LevelTabs/i18n) est en camelCase — même
// écart que dans Inscription/index.jsx (DESIRED_LEVEL_CODE_BY_KEY), inversé
// ici pour retrouver le "key" à partir du code renvoyé par l'API.
export function levelKeyFromCode(code) {
  return code.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
}

// "role", "coins" et "awards" n'ont pas d'équivalent réel côté backend —
// aucune notion de rôle ou de gamification dans le cahier de conception —
// ils restent absents plutôt que d'être inventés ; TopMembers se masque
// proprement quand personne n'a d'award, et MemberDetailsCard n'affiche que
// les stats disponibles. Voir mémoire "project_frontend_backend_ecart_admin".
export function toViewMember(membreAdmin) {
  return {
    id: membreAdmin.id,
    matricule: membreAdmin.membershipNumber,
    name:
      [membreAdmin.firstName, membreAdmin.lastName].filter(Boolean).join(" ") ||
      membreAdmin.phoneNumber,
    domain: membreAdmin.profession,
    city: membreAdmin.city,
    country: membreAdmin.country,
    status: membreAdmin.status,
    levelKey: membreAdmin.level ? levelKeyFromCode(membreAdmin.level.code) : undefined,
    sponsorName: membreAdmin.sponsorName,
    sponsorMatricule: membreAdmin.sponsorMembershipNumber,
    joinedAt: membreAdmin.joinedAt,
    contributed: membreAdmin.contributed,
    referralEarnings: membreAdmin.referralEarnings,
    trainingsCompleted: membreAdmin.trainingsCompleted,
    trainingInProgress: membreAdmin.trainingInProgress,
    sponsoredMembers: (membreAdmin.sponsoredMembers ?? []).map((sponsored) => ({
      name: sponsored.name,
      matricule: sponsored.membershipNumber,
      city: sponsored.city,
    })),
  };
}
