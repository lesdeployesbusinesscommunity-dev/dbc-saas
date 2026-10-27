// Import Dependencies
import { useMemo } from "react";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { listMembers, useMembersStore } from "app/pages/Admin/Membres/membersStore";
import { useNetworkData } from "app/pages/Admin/context/NetworkDataContext";
import { currentAdmin } from "app/pages/Admin/currentAdmin";
import { listLeaders } from "app/pages/Admin/Inscriptions/registrationUtils";
import { getGroups } from "app/pages/Admin/Tontine/mockData";
import { useTontineLedger } from "app/pages/Admin/Tontine/tontineLedger";
import { currentMember } from "app/pages/Membre/currentMember";
import { useAntenneMembers, useLeaderProfile } from "app/pages/Membre/Leader/leaderAccess";
import { makeAdminAudience, makeLeaderAudience } from "./audience";

// ----------------------------------------------------------------------
// Le contexte de ciblage d'un auteur d'annonce : qui il peut viser, et combien
// de personnes cela fait (voir audience.js). Un hook par espace : l'admin lit
// le réseau et toutes les tontines, le leader ne voit que son antenne.

const LEVEL_KEYS = levels.map((level) => level.key);

export function useAdminAudience() {
  const snapshot = useMembersStore();
  const ledger = useTontineLedger();
  const { networksByCountry } = useNetworkData();

  return useMemo(
    () =>
      makeAdminAudience({
        members: listMembers(snapshot),
        groups: getGroups(ledger),
        leaders: listLeaders(networksByCountry),
        levelKeys: LEVEL_KEYS,
        author: { role: "admin", name: currentAdmin.name, matricule: "", branchName: "" },
      }),
    [snapshot, ledger, networksByCountry],
  );
}

export function useLeaderAudience() {
  const leader = useLeaderProfile();
  const roster = useAntenneMembers();

  return useMemo(
    () =>
      makeLeaderAudience({
        roster,
        leader,
        levelKeys: LEVEL_KEYS,
        author: {
          role: "leader",
          name: currentMember.name,
          matricule: currentMember.matricule,
          branchName: leader?.branchName ?? "",
        },
      }),
    [roster, leader],
  );
}
