// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { currentAdmin } from "../currentAdmin";
import { initialMembersByLevel } from "./mockData";

// ----------------------------------------------------------------------
// Registre de "Gestion des membres", gardé dans le navigateur (localStorage,
// protégé par try/catch, mise à jour entre onglets) en attendant le backend
// — même principe que Parametres/platformSettings.js et
// Tontine/tontineLedger.js. Il contient :
//   - "members"  : les membres par niveau (création, modification,
//                  changement d'état, suppression) — ils ne se perdent
//                  plus quand on quitte la page ;
//   - "terms"    : les mandats de leader. Un mandat sans "endedAt" est en
//                  cours ; une fois destitué (ou terminé) il reste dans
//                  l'historique ;
//   - "journal"  : tout ce qui est fait, avec la date et l'admin qui l'a
//                  fait, pour le suivi complet. Chaque ligne garde le nom
//                  et le matricule du membre tels qu'ils étaient (un
//                  membre supprimé reste visible dans le journal).
//
// Types d'événements : created, updated, levelChanged, statusChanged,
// deleted, leaderAppointed, leaderUpdated, leaderDismissed.
const STORAGE_KEY = "dbc-admin-members-v1";
const JOURNAL_LIMIT = 1000;

const clone = (value) => JSON.parse(JSON.stringify(value));

// Données de départ : les membres de démonstration, trois mandats (deux en
// cours, un terminé) et le journal correspondant — pour que les onglets
// "Leaders" et "Journal" ne soient pas vides avant la première action.
function buildSeed() {
  const members = clone(initialMembersByLevel);
  const terms = [
    {
      id: "t-seed-1", memberId: "m3", title: "level", customTitle: "", scope: "Bâtisseur",
      startedAt: "2026-05-10", note: "", endedAt: null, endReason: null, endComment: "",
    },
    {
      id: "t-seed-2", memberId: "m4", title: "country", customTitle: "", scope: "Mali",
      startedAt: "2026-03-02", note: "", endedAt: null, endReason: null, endComment: "",
    },
    {
      id: "t-seed-3", memberId: "m8", title: "training", customTitle: "", scope: "Techniques de vente",
      startedAt: "2026-04-01", note: "", endedAt: "2026-08-20", endReason: "mandateEnd", endComment: "",
    },
  ];

  const journal = [];
  Object.entries(members).forEach(([levelKey, list]) => {
    list.forEach((member) => {
      journal.push({
        id: `e-seed-created-${member.id}`,
        at: `${member.joinedAt}T09:00:00`,
        type: "created",
        memberId: member.id,
        name: member.name,
        matricule: member.matricule,
        by: currentAdmin.name,
        data: { levelKey },
      });
    });
  });
  const byId = Object.fromEntries(
    Object.values(members).flat().map((member) => [member.id, member]),
  );
  terms.forEach((term) => {
    const member = byId[term.memberId];
    journal.push({
      id: `e-seed-appointed-${term.id}`,
      at: `${term.startedAt}T10:00:00`,
      type: "leaderAppointed",
      memberId: member.id,
      name: member.name,
      matricule: member.matricule,
      by: currentAdmin.name,
      data: { title: term.title, customTitle: term.customTitle, scope: term.scope },
    });
    if (term.endedAt) {
      journal.push({
        id: `e-seed-dismissed-${term.id}`,
        at: `${term.endedAt}T10:00:00`,
        type: "leaderDismissed",
        memberId: member.id,
        name: member.name,
        matricule: member.matricule,
        by: currentAdmin.name,
        data: {
          title: term.title, customTitle: term.customTitle, scope: term.scope,
          reason: term.endReason, comment: term.endComment,
        },
      });
    }
  });

  return { members, terms, journal, demoAccount: true };
}

// Le membre de démonstration (DBC-1-0042) a été ajouté après coup : un registre
// déjà enregistré dans le navigateur ne le contient pas. On l'y ajoute une
// seule fois (le drapeau "demoAccount") ; s'il est supprimé ensuite, il ne
// revient pas.
function withDemoAccount(saved) {
  if (saved.demoAccount) return saved;
  const exists = Object.values(saved.members).some((list) =>
    list.some((member) => member.matricule === "DBC-1-0042"),
  );
  if (exists) return { ...saved, demoAccount: true };
  const demo = initialMembersByLevel.starter.find((member) => member.matricule === "DBC-1-0042");
  if (!demo) return saved;
  const member = clone(demo);
  return {
    ...saved,
    demoAccount: true,
    members: { ...saved.members, starter: [...(saved.members.starter ?? []), member] },
    journal: withJournalEntries(saved.journal, member),
  };
}

function withJournalEntries(journal, member) {
  const entry = {
    id: `e-seed-created-${member.id}`,
    at: `${member.joinedAt}T09:00:00`,
    type: "created",
    memberId: member.id,
    name: member.name,
    matricule: member.matricule,
    by: currentAdmin.name,
    data: { levelKey: "starter" },
  };
  return [...journal, entry];
}

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && saved.members && Array.isArray(saved.terms) && Array.isArray(saved.journal)) {
      return withDemoAccount(saved);
    }
  } catch {
    // stockage illisible : on repart des données de démonstration
  }
  return buildSeed();
}

let state = typeof window === "undefined" ? buildSeed() : load();
const listeners = new Set();
let counter = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : les changements restent valables pour cette session
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    emit();
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMembersState() {
  return state;
}

export function useMembersStore() {
  return useSyncExternalStore(subscribe, getMembersState, getMembersState);
}

function commit(next) {
  state = next;
  save();
  emit();
}

function nowIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const todayDate = () => nowIso().slice(0, 10);

function makeEvent(type, member, data = {}) {
  counter += 1;
  return {
    id: `e-${Date.now()}-${counter}`,
    at: nowIso(),
    type,
    memberId: member.id,
    name: member.name,
    matricule: member.matricule,
    by: currentAdmin.name,
    data,
  };
}

function withJournal(journal, events) {
  return [...events, ...journal].slice(0, JOURNAL_LIMIT);
}

// ----------------------------------------------------------------------
// Lectures (fonctions pures sur un instantané "snapshot" de useMembersStore)

export function listMembers(snapshot) {
  return Object.entries(snapshot.members).flatMap(([levelKey, entries]) =>
    entries.map((member) => ({ ...member, levelKey })),
  );
}

export function findMember(snapshot, memberId) {
  return listMembers(snapshot).find((member) => member.id === memberId) ?? null;
}

export function activeTerms(snapshot) {
  return snapshot.terms.filter((term) => !term.endedAt);
}

export function pastTerms(snapshot) {
  return snapshot.terms.filter((term) => term.endedAt);
}

export function activeTermOf(snapshot, memberId) {
  return snapshot.terms.find((term) => term.memberId === memberId && !term.endedAt) ?? null;
}

export function termsOf(snapshot, memberId) {
  return snapshot.terms.filter((term) => term.memberId === memberId);
}

export function eventsOf(snapshot, memberId) {
  return snapshot.journal.filter((event) => event.memberId === memberId);
}

// Matricule suivant libre d'un niveau (le plus grand numéro utilisé + 1).
export function suggestMatricule(snapshot, levelNumber) {
  const prefix = `DBC-${levelNumber}-`;
  const used = listMembers(snapshot)
    .map((member) => member.matricule)
    .filter((matricule) => matricule?.startsWith(prefix))
    .map((matricule) => parseInt(matricule.slice(prefix.length), 10))
    .filter(Number.isFinite);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

// ----------------------------------------------------------------------
// Écritures

// Met fin au mandat en cours d'un membre (désactivation ou suppression) :
// renvoie les mandats mis à jour et l'événement à journaliser, ou null.
function autoEndTerm(terms, member, reason) {
  const term = terms.find((item) => item.memberId === member.id && !item.endedAt);
  if (!term) return null;
  const endedAt = todayDate();
  return {
    terms: terms.map((item) =>
      item.id === term.id ? { ...item, endedAt, endReason: reason, endComment: "" } : item,
    ),
    event: makeEvent("leaderDismissed", member, {
      title: term.title, customTitle: term.customTitle, scope: term.scope,
      reason, comment: "", automatic: true,
    }),
  };
}

const TRACKED_FIELDS = [
  "name", "role", "domain", "city", "country", "sponsorName", "sponsorMatricule", "coins",
  "tontineStartMonth", "email", "whatsapp",
];

export function createMember(levelKey, form) {
  const member = {
    id: `m-${Date.now()}`,
    contributed: 0,
    nextTontineDate: null,
    trainingsCompleted: [],
    trainingInProgress: null,
    sponsoredMembers: [],
    referralEarnings: 0,
    awards: [],
    ...form,
    role: form.role?.trim() || "Membre",
    coins: Number(form.coins) || 0,
    sponsorName: form.sponsorName || null,
    sponsorMatricule: form.sponsorMatricule || null,
    joinedAt: todayDate(),
  };

  // Le parrain voit son nouveau filleul dans sa fiche.
  const members = Object.fromEntries(
    Object.entries(state.members).map(([key, entries]) => [
      key,
      entries.map((entry) =>
        member.sponsorMatricule && entry.matricule === member.sponsorMatricule
          ? {
              ...entry,
              sponsoredMembers: [
                ...(entry.sponsoredMembers ?? []),
                { name: member.name, matricule: member.matricule, city: member.city },
              ],
            }
          : entry,
      ),
    ]),
  );
  members[levelKey] = [...(members[levelKey] ?? []), member];

  commit({
    ...state,
    members,
    journal: withJournal(state.journal, [makeEvent("created", member, { levelKey })]),
  });
  return { ...member, levelKey };
}

export function updateMember(memberId, levelKey, form) {
  const old = findMember(state, memberId);
  if (!old) return;
  const next = { ...old, ...form, coins: Number(form.coins ?? old.coins) || 0 };
  delete next.levelKey;

  const events = [];
  if (old.levelKey !== levelKey) {
    events.push(makeEvent("levelChanged", next, { from: old.levelKey, to: levelKey }));
  }
  if (old.status !== next.status) {
    events.push(makeEvent("statusChanged", next, { from: old.status, to: next.status }));
  }
  const changed = TRACKED_FIELDS.filter((field) => (old[field] ?? "") !== (next[field] ?? ""));
  if (changed.length) events.push(makeEvent("updated", next, { fields: changed }));

  let terms = state.terms;
  if (next.status === "desactive" && old.status !== "desactive") {
    const ended = autoEndTerm(terms, next, "deactivated");
    if (ended) {
      terms = ended.terms;
      events.push(ended.event);
    }
  }

  const members = Object.fromEntries(
    Object.entries(state.members).map(([key, entries]) => [
      key,
      entries.filter((entry) => entry.id !== memberId),
    ]),
  );
  members[levelKey] = [...(members[levelKey] ?? []), next];

  commit({ members, terms, journal: withJournal(state.journal, events.reverse()) });
}

export function setMemberStatus(memberId, status) {
  const old = findMember(state, memberId);
  if (!old || old.status === status) return;
  const events = [makeEvent("statusChanged", old, { from: old.status, to: status })];
  let terms = state.terms;
  if (status === "desactive") {
    const ended = autoEndTerm(terms, old, "deactivated");
    if (ended) {
      terms = ended.terms;
      events.push(ended.event);
    }
  }
  const members = Object.fromEntries(
    Object.entries(state.members).map(([key, entries]) => [
      key,
      entries.map((entry) => (entry.id === memberId ? { ...entry, status } : entry)),
    ]),
  );
  commit({ members, terms, journal: withJournal(state.journal, events.reverse()) });
}

export function deleteMember(memberId) {
  const old = findMember(state, memberId);
  if (!old) return;
  const events = [makeEvent("deleted", old, { levelKey: old.levelKey })];
  let terms = state.terms;
  const ended = autoEndTerm(terms, old, "removed");
  if (ended) {
    terms = ended.terms;
    events.push(ended.event);
  }
  const members = Object.fromEntries(
    Object.entries(state.members).map(([key, entries]) => [
      key,
      entries
        .filter((entry) => entry.id !== memberId)
        .map((entry) =>
          entry.sponsoredMembers?.some((s) => s.matricule === old.matricule)
            ? { ...entry, sponsoredMembers: entry.sponsoredMembers.filter((s) => s.matricule !== old.matricule) }
            : entry,
        ),
    ]),
  );
  commit({ members, terms, journal: withJournal(state.journal, events.reverse()) });
}

// "data" : { title, customTitle, scope, startedAt, note }
export function appointLeader(memberId, data) {
  const member = findMember(state, memberId);
  if (!member || activeTermOf(state, memberId)) return;
  counter += 1;
  const term = {
    id: `t-${Date.now()}-${counter}`,
    memberId,
    title: data.title,
    customTitle: data.title === "other" ? (data.customTitle ?? "").trim() : "",
    scope: (data.scope ?? "").trim(),
    startedAt: data.startedAt || todayDate(),
    note: (data.note ?? "").trim(),
    endedAt: null,
    endReason: null,
    endComment: "",
  };
  commit({
    ...state,
    terms: [...state.terms, term],
    journal: withJournal(state.journal, [
      makeEvent("leaderAppointed", member, {
        title: term.title, customTitle: term.customTitle, scope: term.scope, note: term.note,
      }),
    ]),
  });
}

export function updateLeader(termId, data) {
  const term = state.terms.find((item) => item.id === termId);
  const member = term && findMember(state, term.memberId);
  if (!term || !member || term.endedAt) return;
  const patch = {
    title: data.title,
    customTitle: data.title === "other" ? (data.customTitle ?? "").trim() : "",
    scope: (data.scope ?? "").trim(),
    startedAt: data.startedAt || term.startedAt,
    note: (data.note ?? "").trim(),
  };
  commit({
    ...state,
    terms: state.terms.map((item) => (item.id === termId ? { ...item, ...patch } : item)),
    journal: withJournal(state.journal, [
      makeEvent("leaderUpdated", member, {
        title: patch.title, customTitle: patch.customTitle, scope: patch.scope,
        before: { title: term.title, customTitle: term.customTitle, scope: term.scope },
      }),
    ]),
  });
}

// "data" : { reason, comment, endedAt }
export function dismissLeader(termId, data) {
  const term = state.terms.find((item) => item.id === termId);
  const member = term && findMember(state, term.memberId);
  if (!term || !member || term.endedAt) return;
  const endedAt = data.endedAt || todayDate();
  commit({
    ...state,
    terms: state.terms.map((item) =>
      item.id === termId
        ? { ...item, endedAt, endReason: data.reason, endComment: (data.comment ?? "").trim() }
        : item,
    ),
    journal: withJournal(state.journal, [
      makeEvent("leaderDismissed", member, {
        title: term.title, customTitle: term.customTitle, scope: term.scope,
        reason: data.reason, comment: (data.comment ?? "").trim(),
      }),
    ]),
  });
}
