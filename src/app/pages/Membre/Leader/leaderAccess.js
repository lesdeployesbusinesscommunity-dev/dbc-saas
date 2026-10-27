// Import Dependencies
import { useMemo, useSyncExternalStore } from "react";

// Local Imports
import { listMembers, useMembersStore } from "app/pages/Admin/Membres/membersStore";
import { getGroups } from "app/pages/Admin/Tontine/mockData";
import { useTontineLedger } from "app/pages/Admin/Tontine/tontineLedger";
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { useRegistrations } from "app/pages/Admin/Inscriptions/registrationsStore";
import { useEscalationLog } from "app/pages/Admin/Tontine/escalationStore";
import { followUpStage } from "app/pages/Admin/Tontine/followUpModel";
import { communityMembers } from "../communityMembers";
import { currentMember, subscribeMember } from "../currentMember";
import { deadlineState, interviewStage } from "./interviewModel";

// ----------------------------------------------------------------------
// Qui est leader d'antenne, et ce qui lui est confié. Aujourd'hui c'est le
// profil du compte connecté qui le dit (champ "leader" de currentMember.js) ;
// une fois le backend branché, ce sera le rôle renvoyé par le serveur.

// Le profil "leader" du compte connecté, ou null pour un simple membre :
// { memberId, branchName, location, country, cities }.
export function useLeaderProfile() {
  return useSyncExternalStore(
    subscribeMember,
    () => currentMember.leader ?? null,
    () => null,
  );
}

// Les dossiers d'inscription confiés à ce leader, les plus pressants en
// premier : à faire (le délai le plus court d'abord), à relancer
// (injoignable), puis ceux dont le compte-rendu est rendu.
const STAGE_ORDER = { todo: 0, unreachable: 1, done: 2, refused: 3 };

export function useLeaderDossiers() {
  const leader = useLeaderProfile();
  const registrations = useRegistrations();

  return useMemo(() => {
    if (!leader) return [];
    return registrations
      .filter((item) => item.assignment?.leaderId === leader.memberId)
      .map((registration) => ({
        registration,
        stage: interviewStage(registration),
        deadline: deadlineState(registration.assignment),
      }))
      .sort(
        (a, b) =>
          STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] ||
          (a.deadline?.daysLeft ?? 99) - (b.deadline?.daysLeft ?? 99),
      );
  }, [leader, registrations]);
}

// Nombre de dossiers à traiter (pas encore de compte-rendu, ou candidat
// injoignable) et, parmi eux, ceux dont le délai est dépassé.
export function summarizeDossiers(dossiers) {
  const open = dossiers.filter((item) => item.stage === "todo" || item.stage === "unreachable");
  return {
    open: open.length,
    overdue: open.filter((item) => item.deadline?.overdue).length,
    soon: open.filter((item) => item.deadline?.soon).length,
  };
}

// ----------------------------------------------------------------------
// Les MEMBRES DE L'ANTENNE : ceux de la liste des membres (Gestion des
// membres) dont la ville est couverte par l'antenne, plus les membres des
// groupes de tontine installés dans ces villes. Pour chacun : ses contacts
// (pour la relance) et l'état de sa cotisation du tour en cours.
const inCities = (city, cities) => {
  const first = normalizeSearchText(String(city ?? "").split(",")[0]);
  return cities.some((entry) => normalizeSearchText(entry) === first);
};

export { inCities };

// Les groupes de tontine en cours, tous niveaux confondus : une entrée par
// membre, avec l'état de sa cotisation. Un même membre dans plusieurs groupes
// garde le pire état (en retard) et le plus grand nombre de mois manqués.
function tontineStatuses(groups) {
  const byName = new Map();
  groups
    .filter((group) => group.status === "running")
    .forEach((group) => {
      group.members.forEach((member) => {
        // Le tour en cours, pas encore payé mais pas encore échu, n'est pas un retard.
        const missed = Math.max(0, member.missedCount - (member.isAwaiting ? 1 : 0));
        const late = missed > 0;
        const previous = byName.get(member.name);
        byName.set(member.name, {
          city: member.city,
          levelKey: late || !previous ? group.levelKey : previous.levelKey,
          late: late || previous?.late === true,
          missed: Math.max(missed, previous?.missed ?? 0),
          amount: group.cotisation,
        });
      });
    });
  return byName;
}

export function buildAntenneRoster(leader, members, groups = getGroups()) {
  if (!leader) return [];
  const statuses = tontineStatuses(groups);
  const phoneOf = (name) => communityMembers.find((entry) => entry.name === name)?.phone ?? "";

  const roster = new Map();
  const add = (name, base) => {
    const status = statuses.get(name);
    roster.set(name, {
      key: base.matricule || name,
      name,
      city: base.city,
      matricule: base.matricule ?? "",
      levelKey: status?.levelKey ?? base.levelKey ?? null,
      phone: base.whatsapp || phoneOf(name),
      email: base.email ?? "",
      joinedAt: base.joinedAt ?? null,
      contribution: status
        ? { state: status.late ? "late" : "ok", missed: status.missed, amount: status.amount }
        : { state: "none", missed: 0, amount: 0 },
    });
  };

  members
    .filter((member) => member.id !== leader.memberId && inCities(member.city, leader.cities))
    .filter((member) => member.status !== "desactive")
    .forEach((member) => add(member.name, member));

  statuses.forEach((status, name) => {
    if (name === currentMember.name || roster.has(name) || !inCities(status.city, leader.cities)) return;
    add(name, { city: String(status.city).split(",")[0], levelKey: status.levelKey });
  });

  return Array.from(roster.values()).sort(
    (a, b) =>
      Number(b.contribution.state === "late") - Number(a.contribution.state === "late") ||
      a.name.localeCompare(b.name),
  );
}

export function useAntenneMembers() {
  const leader = useLeaderProfile();
  const snapshot = useMembersStore();
  const ledger = useTontineLedger();
  return useMemo(
    () => buildAntenneRoster(leader, listMembers(snapshot), getGroups(ledger)),
    [leader, snapshot, ledger],
  );
}

// ----------------------------------------------------------------------
// Les DOSSIERS DE RELANCE confiés à ce leader : un membre de son antenne en
// retard de cotisation, dont le chef d'antenne (le "Community Manager
// Financier" de la relance automatique) doit prendre des nouvelles et rendre un
// rapport. À mener d'abord (le plus en retard en premier), puis injoignables,
// puis rendus.
const FOLLOW_ORDER = { todo: 0, unreachable: 1, done: 2 };

export function useLeaderFollowUps() {
  const leader = useLeaderProfile();
  const { entries } = useEscalationLog();

  return useMemo(() => {
    if (!leader) return [];
    return entries
      .filter((entry) => entry.step === "cm" && entry.assignment?.leaderId === leader.memberId)
      .map((entry) => ({ entry, stage: followUpStage(entry) }))
      .sort((a, b) => FOLLOW_ORDER[a.stage] - FOLLOW_ORDER[b.stage] || b.entry.daysLate - a.entry.daysLate);
  }, [leader, entries]);
}

export const countOpenFollowUps = (followUps) =>
  followUps.filter((item) => item.stage === "todo" || item.stage === "unreachable").length;
