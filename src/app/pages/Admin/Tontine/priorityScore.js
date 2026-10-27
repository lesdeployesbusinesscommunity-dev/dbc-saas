// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { listLeaders } from "../Inscriptions/registrationUtils";
import { tourOfPosition } from "app/pages/Membre/Tontine/tontineModel";
import { normalizeSearchText } from "../searchUtils";

// ----------------------------------------------------------------------
// Le "Score de Priorité DBC" (SPD) : c'est la plateforme, et non plus les
// membres, qui décide dans quel ordre les membres d'un groupe reçoivent la
// cagnotte. Chaque membre reçoit une note sur 100 points, répartie sur 5
// critères. Ce fichier ne contient que les RÈGLES (tableaux de points, calcul
// du score, classement du groupe) : aucune donnée enregistrée, aucun affichage.
//   - priorityStore.js garde ce que l'administration et les membres saisissent
//     (urgences, notes du parrain, échanges de rang...) ;
//   - PriorityRoadmap.jsx explique le tout aux membres et à l'administration.
//
// Les libellés sont dans i18n ("tontinePriority.*") : ici seulement des clés.

export const MIN_MONTHS_BEFORE_BENEFIT = 6; // un nouveau membre ne reçoit pas avant
export const PROBATION_MONTHS = 2; // critère 4 : période probatoire
export const URGENCY_REVIEW_HOURS = 72; // délai du Comité de Gouvernance

export const CRITERIA = [
  { key: "urgency", max: 30 },
  { key: "regularity", max: 25 },
  { key: "coins", max: 20 },
  { key: "level", max: 15 },
  { key: "recommendation", max: 10 },
];

// Critère 1 — Urgence vérifiée et documentée (30 points).
export const URGENCY_ROWS = [
  { key: "productive", points: 30, proof: true },
  { key: "debt", points: 25, proof: true },
  { key: "opportunity", points: 20, proof: true },
  { key: "social", points: 15, proof: true },
  { key: "planned", points: 5, proof: false },
  { key: "none", points: 0, proof: false },
];

// Critère 2 — Régularité de paiement (25 points), calculée automatiquement.
export const REGULARITY_ROWS = [
  { key: "zero", points: 25 },
  { key: "one", points: 20 },
  { key: "two", points: 15 },
  { key: "three", points: 10 },
  { key: "many", points: 5 },
  { key: "active", points: 0 },
];

// Critère 3 — Engagement communautaire, en DBC Coins (20 points).
export const COINS_ROWS = [
  { key: "c1000", min: 1000, points: 20 },
  { key: "c500", min: 500, points: 15 },
  { key: "c200", min: 200, points: 10 },
  { key: "c50", min: 50, points: 5 },
  { key: "c0", min: 0, points: 0 },
];

// Critère 4 — Ancienneté et niveau DBC (15 points). Les niveaux sont numérotés
// de 1 (Starter) à 8 (Légende), dans l'ordre de Simulateur/data.js.
export const LEVEL_ROWS = [
  { key: "high", from: 5, to: 8, points: 15 },
  { key: "mid", from: 3, to: 4, points: 10 },
  { key: "low", from: 1, to: 2, points: 5 },
  { key: "probation", points: 0 },
];

// Critère 5 — Recommandation du mentor-parrain (10 points). Le parrain note son
// filleul sur quatre qualités (de 0 à 10) ; la moyenne, arrondie, donne les
// points. Sans note dans les 72 h : valeur par défaut. Un veto motivé par écrit
// et reconnu valide par le Comité de Gouvernance retire 5 points.
export const RECOMMENDATION_ROWS = [
  { key: "rated", points: 10 },
  { key: "default", points: 3 },
  { key: "veto", points: -5 },
];
export const RATING_ASPECTS = ["reliability", "commitment", "teamwork", "integrity"];
export const RATING_HOURS = 72; // délai du parrain pour noter
export const RATING_REMINDER_HOURS = [24, 48, 66]; // rappels automatiques, depuis la demande

export const GOLDEN_RULES = ["publication", "topScores", "ends", "swap", "tie", "recalc", "bylaws"];

// Le tableau XXVI du règlement : un groupe de 10 membres au niveau Bâtisseur
// (10 000 Fcfa/mois). "star" : mêmes scores élevés, mais passent en dernier.
export const EXAMPLE_ROWS = [
  { rank: 1, name: "Marie K.", note: "equipment", urgency: 30, regularity: 25, coins: 18, levelMentor: 24, total: 97 },
  { rank: 2, name: "Paul A.", note: "order", urgency: 20, regularity: 25, coins: 20, levelMentor: 20, total: 85 },
  { rank: 3, name: "Jean T.", note: "school", urgency: 15, regularity: 20, coins: 15, levelMentor: 18, total: 68 },
  { rank: 9, name: "Robert N.", note: "mentor", urgency: 5, regularity: 25, coins: 20, levelMentor: 24, total: 74, star: true },
  { rank: 10, name: "Lisa C.", note: "cm", urgency: 5, regularity: 25, coins: 20, levelMentor: 24, total: 74, star: true },
];

// ----------------------------------------------------------------------
// Les points de chaque critère.

export const urgencyPoints = (categoryKey) => URGENCY_ROWS.find((row) => row.key === categoryKey)?.points ?? 0;

// "late" : { count, longest (jours du plus long retard), current (retard en
// cours ou pénalité non soldée) }. Retourne la ligne du tableau qui s'applique.
export function regularityRow({ count = 0, longest = 0, current = false }) {
  if (current) return "active";
  if (count === 0) return "zero";
  if (longest <= 7) {
    if (count === 1) return "one";
    if (count === 2) return "two";
    if (count === 3) return "three";
    return "many";
  }
  if (longest <= 15 && count <= 3) return "three";
  return "many";
}

export const coinsRow = (coins) => COINS_ROWS.find((row) => coins >= row.min)?.key ?? "c0";

export function levelRow(levelNumber, monthsInCommunity) {
  if (monthsInCommunity < PROBATION_MONTHS) return "probation";
  return LEVEL_ROWS.find((row) => row.from !== undefined && levelNumber >= row.from && levelNumber <= row.to)?.key ?? "low";
}

// La note du parrain : { average } (moyenne des qualités, de 0 à 10) ou null.
export function averageOf(aspects) {
  const values = RATING_ASPECTS.map((key) => aspects?.[key]).filter((value) => Number.isFinite(value));
  if (values.length < RATING_ASPECTS.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function recommendationRow({ rating, veto }) {
  if (veto?.valid && veto.reason?.trim()) return "veto";
  return rating?.average != null ? "rated" : "default";
}

// L'état de la demande de note faite au parrain : "pending" (dans les 72 h),
// "done" (note reçue) ou "expired" (délai dépassé, valeur par défaut).
export function ratingState(request, now = Date.now()) {
  if (!request) return "none";
  if (request.average != null) return "done";
  return now > new Date(request.dueAt).getTime() ? "expired" : "pending";
}

const pointsIn = (rows, key) => rows.find((row) => row.key === key)?.points ?? 0;

// Le score d'un membre. "input" : { urgency (clé), late, coins, levelNumber,
// months (ancienneté en mois), rating, veto }.
export function priorityScore(input) {
  const parts = {
    urgency: { key: input.urgency ?? "none", points: urgencyPoints(input.urgency) },
    regularity: { key: regularityRow(input.late ?? {}) },
    coins: { key: coinsRow(input.coins ?? 0) },
    level: { key: levelRow(input.levelNumber ?? 1, input.months ?? 0) },
    recommendation: { key: recommendationRow(input) },
  };
  parts.regularity.points = pointsIn(REGULARITY_ROWS, parts.regularity.key);
  parts.coins.points = pointsIn(COINS_ROWS, parts.coins.key);
  parts.level.points = pointsIn(LEVEL_ROWS, parts.level.key);
  parts.recommendation.points =
    parts.recommendation.key === "rated"
      ? Math.max(0, Math.min(10, Math.round(input.rating.average)))
      : pointsIn(RECOMMENDATION_ROWS, parts.recommendation.key);
  // Un membre trop récent n'a encore rien à évaluer pour les Coins et le niveau :
  // la case reste vide (la plateforme les lit seule, dans le journal du membre).
  const young = (input.months ?? 0) < PROBATION_MONTHS;
  parts.coins.empty = young;
  parts.level.empty = young;
  const total = CRITERIA.reduce((sum, { key }) => sum + parts[key].points, 0);
  return { parts, total };
}

// ----------------------------------------------------------------------
// Les candidats d'un groupe : pour chaque membre, ce qu'on sait de lui.

const norm = normalizeSearchText;

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DEMO_COINS = [20, 60, 120, 180, 260, 340, 480, 560, 750, 900, 1100, 1350];
const DEMO_URGENCY = ["productive", "debt", "opportunity", "social", "planned", "none", "social", "planned"];
const DEMO_RATINGS = [null, 9.5, 8, 6.5, null, 7.2];

// Pour un membre qui n'a pas (encore) de fiche dans la plateforme (les groupes
// de démonstration), des valeurs fixes tirées de son nom : la même personne a
// toujours les mêmes. Le backend les remplacera par les vraies données.
export function demoProfile(name, groupLevelNumber) {
  const h = hash(norm(name));
  return {
    coins: DEMO_COINS[h % DEMO_COINS.length],
    months: 1 + ((h >>> 3) % 30),
    levelNumber: Math.min(8, groupLevelNumber + ((h >>> 9) % 3)),
    urgency: DEMO_URGENCY[(h >>> 5) % DEMO_URGENCY.length],
    rating: DEMO_RATINGS[(h >>> 7) % DEMO_RATINGS.length],
  };
}

export const levelNumberOf = (levelKey) => Math.max(1, levels.findIndex((level) => level.key === levelKey) + 1);

// Les retards passés d'un membre du groupe. Le détail (nombre de jours) n'est
// pas gardé dans l'historique : un mois manqué puis régularisé compte pour un
// retard de moins de 7 jours. Le mois en cours ne compte que s'il est en
// retard (alors le critère vaut 0).
export function lateOf(member) {
  const past = member.paidThisMonth === false ? member.history.slice(0, -1) : member.history;
  const count = past.filter((paid) => !paid).length;
  return { count, longest: count > 0 ? 7 : 0, current: Boolean(member.isLate) };
}

// Construit les candidats d'un groupe (objet de getGroups). "people" : la liste
// des membres de la plateforme (listMembers) ; "lookup" : { urgencyOf(person),
// ratingOf(person), vetoOf(person) } qui lit les enregistrements (priorityStore.js).
export function buildCandidates({ group, people, lookup, today = dayjs() }) {
  const byName = new Map(people.map((person) => [norm(person.name), person]));
  const groupLevel = levelNumberOf(group.levelKey);
  return group.members.map((member) => {
    const real = byName.get(norm(member.name)) ?? null;
    const demo = real ? null : demoProfile(member.name, groupLevel);
    const identity = { matricule: real?.matricule ?? member.matricule ?? "", name: member.name };
    const declaration = lookup.declarationOf(identity);
    const request = lookup.ratingOf(identity);
    const veto = lookup.vetoOf(identity);

    // Urgence : seule une déclaration VALIDÉE par le Comité compte. Les
    // membres de démonstration ont une urgence fictive déjà validée.
    let urgency = "none";
    if (declaration) urgency = declaration.status === "validated" ? declaration.category : "none";
    else if (demo) urgency = demo.urgency;

    const rating = request?.average != null ? { average: request.average } : demo?.rating != null && !request ? { average: demo.rating } : null;
    const months = real ? Math.max(0, today.diff(dayjs(real.joinedAt), "month")) : demo.months;

    const input = {
      urgency,
      late: lateOf(member),
      coins: real ? (real.coins ?? 0) : demo.coins,
      levelNumber: real ? levelNumberOf(real.levelKey) : demo.levelNumber,
      months,
      rating,
      veto,
    };
    return {
      id: member.id,
      name: member.name,
      city: member.city,
      matricule: identity.matricule,
      recordId: real?.id ?? null,
      sponsorMatricule: real?.sponsorMatricule ?? "",
      sponsorName: real?.sponsorName ?? "",
      demo: !real,
      months,
      late: input.late,
      coins: input.coins,
      levelNumber: input.levelNumber,
      rating,
      veto,
      ratingRequest: request,
      declaration,
      ...priorityScore(input),
    };
  });
}

// ----------------------------------------------------------------------
// Le classement d'un groupe.
//   - du meilleur score au plus faible : les 3 premiers mois vont donc aux
//     scores les plus élevés ;
//   - le mentor-parrain du groupe est avant-dernier, le Community Manager Local
//     dernier, quel que soit leur score ;
//   - un membre n'est jamais placé sur un mois qui tombe dans ses 6 premiers
//     mois : il glisse sur le premier mois possible (les suivants remontent) ;
//   - à score égal, le tirage au sort public décide (s'il n'a pas encore eu
//     lieu, l'égalité est signalée) ;
//   - les échanges de rang validés sont appliqués en dernier.
// "options" : { perTour, startMonth (dayjs, mois du tour 1), mentorId, cmId,
// draw: [ids dans l'ordre du tirage], swaps: [{ a, b }] }.
export function rankGroup(candidates, { perTour, startMonth, mentorId = null, cmId = null, draw = [], swaps = [] }) {
  const total = candidates.length;
  const mentor = candidates.find((c) => c.id === mentorId) ?? null;
  const cm = candidates.find((c) => c.id === cmId && c.id !== mentorId) ?? null;
  const special = new Set([mentor?.id, cm?.id].filter(Boolean));

  const drawIndex = (id) => {
    const index = draw.indexOf(id);
    return index === -1 ? Infinity : index;
  };
  const originalIndex = new Map(candidates.map((c, i) => [c.id, i]));
  const pool = candidates
    .filter((c) => !special.has(c.id))
    .sort((a, b) => b.total - a.total || drawIndex(a.id) - drawIndex(b.id) || originalIndex.get(a.id) - originalIndex.get(b.id));

  // Égalités : plusieurs membres au même score. "tie" = pas encore placés par
  // l'administration ; "inTie" = dans une égalité (placée ou non).
  const countByTotal = new Map();
  pool.forEach((c) => countByTotal.set(c.total, (countByTotal.get(c.total) ?? 0) + 1));
  const tied = (c) => countByTotal.get(c.total) > 1 && drawIndex(c.id) === Infinity;

  const monthOfTour = (tour) => startMonth.add(tour - 1, "month");
  const monthsAt = (c, date) => c.months + date.diff(dayjs().startOf("month"), "month");

  const entries = [];
  const delayed = new Set();
  const slots = total - special.size;
  for (let i = 0; i < slots; i += 1) {
    const date = monthOfTour(tourOfPosition(i, perTour));
    let index = pool.findIndex((c) => monthsAt(c, date) >= MIN_MONTHS_BEFORE_BENEFIT);
    if (index === -1) index = 0;
    pool.slice(0, index).forEach((c) => delayed.add(c.id));
    const [picked] = pool.splice(index, 1);
    entries.push({ candidate: picked, role: null, tie: tied(picked), inTie: countByTotal.get(picked.total) > 1 });
  }
  if (mentor) entries.push({ candidate: mentor, role: "mentor", tie: false });
  if (cm) entries.push({ candidate: cm, role: "cm", tie: false });

  // Échanges de rang entre deux membres (déjà co-signés et validés).
  swaps.forEach(({ a, b }) => {
    const i = entries.findIndex((e) => e.candidate.id === a);
    const j = entries.findIndex((e) => e.candidate.id === b);
    if (i === -1 || j === -1) return;
    const keep = entries[i];
    entries[i] = { ...entries[j], swapped: true };
    entries[j] = { ...keep, swapped: true };
  });

  return entries.map((entry, i) => {
    const tour = tourOfPosition(i, perTour);
    return {
      ...entry,
      rank: i + 1,
      tour,
      month: monthOfTour(tour),
      delayed: delayed.has(entry.candidate.id),
    };
  });
}

// ----------------------------------------------------------------------
// Le classement complet d'un groupe, tel que l'administration et les membres
// le voient. Un groupe qui n'a pas démarré garde son mois de départ ; un groupe
// en cours ou terminé est classé pour son PROCHAIN cycle (le score est
// recalculé à chaque nouveau cycle). "priority" : l'instantané de
// priorityStore.js ; "lookup" : lookupFor(priority).
const CYCLE_MONTHS = 12;

export const cycleStartOf = (group) =>
  group.status === "pending" ? group.startMonth : group.startMonth.add(CYCLE_MONTHS, "month");

// Le mentor-parrain du groupe vient de l'inscription (champ « Parrain ») : c'est
// le membre du groupe qui a parrainé le plus d'autres membres du groupe. Sans
// parrain trouvé, ou si l'administration en désigne un autre, c'est elle qui décide.
export function detectMentor(candidates) {
  const counts = new Map();
  candidates.forEach((c) => {
    if (c.sponsorMatricule) counts.set(c.sponsorMatricule, (counts.get(c.sponsorMatricule) ?? 0) + 1);
  });
  let best = null;
  candidates.forEach((c) => {
    const n = c.matricule ? (counts.get(c.matricule) ?? 0) : 0;
    if (n > 0 && (!best || n > best.n)) best = { id: c.id, n };
  });
  return best?.id ?? null;
}

// Le Community Manager Local est un chef d'antenne (leader) : n'importe quel
// leader d'antenne du groupe peut l'être. "leaderIds" : les identifiants des
// membres qui dirigent une antenne du réseau (Gestion du réseau), hors Superviseur National.
export const antenneLeaderIds = (networksByCountry) =>
  new Set(listLeaders(networksByCountry).filter((leader) => !leader.isNational).map((leader) => leader.leaderId));
//
export const isLeaderCandidate = (candidate, leaderIds) => Boolean(candidate.recordId && leaderIds.has(candidate.recordId));

export function detectCommunityManager(candidates, leaderIds, exceptId) {
  return candidates.find((c) => c.id !== exceptId && isLeaderCandidate(c, leaderIds))?.id ?? null;
}

export function computeRanking({ group, people, priority, lookup, leaderIds = new Set() }) {
  const candidates = buildCandidates({ group, people, lookup });
  const roles = priority.roles[group.id] ?? {};
  const mentorAutoId = detectMentor(candidates);
  const mentorId = roles.mentorId ?? mentorAutoId;
  const cmAutoId = detectCommunityManager(candidates, leaderIds, mentorId);
  const ranking = rankGroup(candidates, {
    perTour: group.perTour,
    startMonth: cycleStartOf(group),
    mentorId,
    cmId: roles.cmId ?? cmAutoId,
    draw: priority.draws[group.id]?.order ?? [],
    swaps: priority.swaps[group.id] ?? [],
  });
  return { candidates, ranking, mentorAutoId, cmAutoId };
}
