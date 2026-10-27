// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { monthsFrom } from "../components/monthUtils";

// ----------------------------------------------------------------------
// "Demandes de choix" : c'est l'ADMINISTRATION qui décide de l'ordre de
// passage ("bouffer") d'un groupe de tontine. Elle envoie à chaque futur
// membre du groupe une demande (message sur la plateforme + rappel par
// e-mail et WhatsApp) : "choisissez 3 mois dans cette période". Les choix
// reviennent ici, l'administration en tire l'ordre (proposition
// automatique, modifiable à la main), puis le valide : le groupe est alors
// créé avec cet ordre (voir tontineLedger.js : createTontineGroup).
//
// Une demande ("campagne") :
//   id, levelKey, startMonth ("AAAA-MM"), capacity (places du nouveau groupe : 36),
//   perMonth (membres par mois : 3 ; 1 pour une ancienne demande), used ({ mois:
//   places déjà prises }, quand la demande porte sur un groupe ouvert),
//   targetGroupId (si la demande porte sur les mois libres d'un groupe
//   existant), months (la période proposée : 12 mois), targets ([{ matricule, name, city,
//   email, whatsapp }]), deadline ("AAAA-MM-JJ"), message, channels
//   ({ email, whatsapp } : rappels prévus), createdAt,
//   status ("open" | "closed" | "validated"),
//   responses  { [matricule]: { months: [3 mois classés par préférence], at } },
//   reminders  { [matricule]: { email: date, whatsapp: date } },
//   order      { [matricule]: mois attribué },
//   groupId    (une fois validée).
//
// Gardé dans le navigateur (localStorage, try/catch, mise à jour entre
// onglets) en attendant le backend, comme les autres registres.
export const CHOICES = 3;

// Le choix des mois par les membres est retiré : c'est l'administration qui
// place chaque membre (et qui départage les égalités du classement). Tant que ce
// réglage est à "false", aucune demande n'est affichée nulle part (ni côté admin,
// ni côté membre, ni dans les notifications), même s'il en reste d'anciennes.
export const MONTH_CHOICES_ENABLED = false;

const STORAGE_KEY = "dbc-tontine-choices-v1";
const EMPTY = { campaigns: [] };

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.campaigns)) return saved;
  } catch {
    // stockage illisible : on repart de zéro
  }
  return { campaigns: [] };
}

let state = typeof window === "undefined" ? EMPTY : load();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function commit(next) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // stockage indisponible : valable pour cette session
  }
  emit();
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

export function getMonthChoices() {
  return MONTH_CHOICES_ENABLED ? state : EMPTY;
}

export function useMonthChoices() {
  return useSyncExternalStore(subscribe, getMonthChoices, getMonthChoices);
}

const patchCampaign = (id, patcher) =>
  commit({
    campaigns: state.campaigns.map((campaign) => (campaign.id === id ? patcher(campaign) : campaign)),
  });

// ----------------------------------------------------------------------
// Lectures

// Les demandes qui concernent ce membre (par matricule).
export function campaignsFor(snapshot, matricule) {
  return snapshot.campaigns.filter((campaign) => campaign.targets.some((target) => target.matricule === matricule));
}

export const isPastDeadline = (campaign, today = new Date().toISOString().slice(0, 10)) =>
  campaign.deadline < today;

// Les membres qui ont répondu / pas encore répondu.
export function answerCounts(campaign) {
  const answered = campaign.targets.filter((target) => campaign.responses[target.matricule]).length;
  return { answered, total: campaign.targets.length };
}

// Combien de membres peuvent encore recevoir la cagnotte ce mois-là : 3 par
// mois (1 pour une ancienne demande), moins les places déjà prises dans un
// groupe ouvert.
export const monthRoom = (campaign, month) => (campaign.perMonth ?? 1) - (campaign.used?.[month] ?? 0);

// Les membres de la demande à qui ce mois est attribué.
export const holdersOf = (campaign, month) =>
  campaign.targets.filter((target) => campaign.order[target.matricule] === month);

// Proposition d'ordre : on sert d'abord ceux qui ont répondu le plus tôt ;
// chacun reçoit son 1er choix libre, sinon son 2e, sinon son 3e, sinon le
// premier mois qui a encore de la place dans la période (ceux qui n'ont pas
// répondu passent en dernier). Un mois accueille 3 membres au plus. C'est une
// PROPOSITION : l'administration décide.
export function proposeOrder(campaign) {
  const taken = {};
  const hasRoom = (month) => (taken[month] ?? 0) < monthRoom(campaign, month);
  const order = {};
  const queue = [...campaign.targets].sort((a, b) => {
    const ra = campaign.responses[a.matricule];
    const rb = campaign.responses[b.matricule];
    if (ra && rb) return ra.at - rb.at;
    if (ra) return -1;
    if (rb) return 1;
    return a.name.localeCompare(b.name);
  });
  queue.forEach((target) => {
    const choices = campaign.responses[target.matricule]?.months ?? [];
    const pick = choices.find(hasRoom) ?? campaign.months.find(hasRoom);
    if (pick) {
      order[target.matricule] = pick;
      taken[pick] = (taken[pick] ?? 0) + 1;
    }
  });
  return order;
}

// Où l'attribution se place dans les choix du membre : 1, 2, 3, ou 0 (hors
// de ses choix), ou null si rien n'est attribué / pas de réponse.
export function choiceRank(campaign, matricule) {
  const month = campaign.order[matricule];
  const response = campaign.responses[matricule];
  if (!month || !response) return null;
  const index = response.months.indexOf(month);
  return index === -1 ? 0 : index + 1;
}

// Un mois est-il attribué à trop de membres (plus de 3, ou plus que les places libres) ?
export const isOverbooked = (campaign, month) => holdersOf(campaign, month).length > monthRoom(campaign, month);

// L'ordre est-il complet (un mois par membre, jamais plus de 3 membres sur le même mois) ?
export function isOrderComplete(campaign) {
  const months = campaign.targets.map((target) => campaign.order[target.matricule]).filter(Boolean);
  return months.length === campaign.targets.length && months.every((month) => !isOverbooked(campaign, month));
}

// ----------------------------------------------------------------------
// Écritures

// "data" : { levelKey, startMonth, capacity, perMonth, used?, months?, groupId?,
// targets, deadline, message, channels }.
// - nouveau groupe : 12 mois à partir de "startMonth" (36 places, "perMonth" = 3
//   membres par mois) ;
// - mois libres d'un groupe déjà ouvert : "groupId" et "months" (les mois qui
//   ont encore une place) avec "used" (les places déjà prises) — les membres
//   choisis y seront ajoutés à la validation.
export function createCampaign(data) {
  const campaign = {
    id: `c-${Date.now()}`,
    levelKey: data.levelKey,
    startMonth: data.startMonth,
    capacity: data.capacity ?? null,
    perMonth: data.perMonth ?? 1,
    used: data.used ?? {},
    targetGroupId: data.groupId ?? null,
    months: data.months ?? monthsFrom(data.startMonth, Math.ceil((data.capacity ?? data.targets.length) / (data.perMonth ?? 1))),
    targets: data.targets,
    deadline: data.deadline,
    message: data.message,
    channels: data.channels,
    createdAt: Date.now(),
    status: "open",
    responses: {},
    reminders: {},
    order: {},
    groupId: null,
  };
  commit({ campaigns: [campaign, ...state.campaigns] });
  return campaign;
}

// Le membre envoie (ou corrige) ses 3 mois, classés du plus souhaité au moins
// souhaité. Refusé si la demande n'est plus ouverte ou si les mois sont hors
// période / en double.
export function saveResponse(campaignId, matricule, months) {
  const campaign = state.campaigns.find((item) => item.id === campaignId);
  if (!campaign || campaign.status !== "open" || isPastDeadline(campaign)) return false;
  if (!campaign.targets.some((target) => target.matricule === matricule)) return false;
  const valid =
    months.length === Math.min(CHOICES, campaign.months.length) &&
    new Set(months).size === months.length &&
    months.every((month) => campaign.months.includes(month));
  if (!valid) return false;
  patchCampaign(campaignId, (item) => ({
    ...item,
    responses: { ...item.responses, [matricule]: { months, at: Date.now() } },
  }));
  return true;
}

// Rappel préparé pour un membre ("email" | "whatsapp") : le site ne l'envoie
// pas lui-même, il ouvre le message pré-rempli ; on garde la date.
export function recordReminder(campaignId, matricule, channel) {
  patchCampaign(campaignId, (item) => ({
    ...item,
    reminders: {
      ...item.reminders,
      [matricule]: { ...(item.reminders[matricule] ?? {}), [channel]: Date.now() },
    },
  }));
}

export function setAssignment(campaignId, matricule, month) {
  patchCampaign(campaignId, (item) => {
    const order = { ...item.order };
    if (month) order[matricule] = month;
    else delete order[matricule];
    return { ...item, order };
  });
}

export function applyProposal(campaignId) {
  patchCampaign(campaignId, (item) => ({ ...item, order: proposeOrder(item) }));
}

export function setCampaignStatus(campaignId, status) {
  patchCampaign(campaignId, (item) => ({ ...item, status }));
}

export function markValidated(campaignId, groupId) {
  patchCampaign(campaignId, (item) => ({ ...item, status: "validated", groupId, validatedAt: Date.now() }));
}
