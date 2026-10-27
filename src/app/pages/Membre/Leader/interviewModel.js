// Import Dependencies
import dayjs from "dayjs";

// ----------------------------------------------------------------------
// Le MODÈLE de l'entretien d'inscription, partagé par l'espace leader (qui
// remplit le compte-rendu) et l'administration (qui le lit et décide
// d'ajouter ou non le membre). Tout est à COCHER : aucune question ne
// demande un long texte, seulement un commentaire facultatif d'une ligne.

// Délai accordé au leader pour rendre son compte-rendu, à partir de
// l'attribution du dossier. Un rappel lui est envoyé quand il reste
// "REMINDER_DAYS" jours ou moins. Passé le délai, rien n'est décidé tout
// seul : l'administration voit le retard et peut réattribuer le dossier.
export const DEADLINE_DAYS = 7;
export const REMINDER_DAYS = 2;

// Comment l'entretien a été mené.
export const INTERVIEW_MODES = ["whatsapp", "call", "inPerson"];

// Les points à vérifier, notés Oui / Moyen / Non.
export const CRITERIA = ["tontine", "contribution", "project", "consistency", "motivation"];
export const RATINGS = ["yes", "medium", "no"];

// Signaux d'alerte, à cocher s'ils ont été constatés.
export const RED_FLAGS = ["pressure", "money", "contradiction"];

// Raisons d'un entretien non concluant, à cocher.
export const REFUSAL_REASONS = ["tontine", "contribution", "project", "consistency", "motivation", "other"];

export const DECISIONS = ["concluant", "nonConcluant", "injoignable"];

export const COMMENT_MAX = 140;

export const emptyDraft = () => ({
  mode: null,
  reachable: null,
  ratings: {},
  flags: [],
  reasons: [],
  comment: "",
});

// Quelles décisions le compte-rendu permet-il de prendre ? Les boutons
// "Concluant" / "Non concluant" / "Injoignable" restent verrouillés tant que
// le compte-rendu n'est pas assez rempli.
export function availableDecisions(draft) {
  const hasMode = Boolean(draft.mode);
  const complete =
    hasMode && draft.reachable === true && CRITERIA.every((key) => RATINGS.includes(draft.ratings[key]));
  return {
    complete,
    concluant: complete,
    nonConcluant: complete && draft.reasons.length > 0,
    injoignable: hasMode && draft.reachable === false,
  };
}

// Une suggestion (jamais une décision automatique) à partir des réponses :
// "concluant", "nonConcluant" ou "toReview". null tant que ce n'est pas rempli.
export function suggestDecision(draft) {
  if (!availableDecisions(draft).complete) return null;
  const values = CRITERIA.map((key) => draft.ratings[key]);
  const no = values.filter((value) => value === "no").length;
  const medium = values.filter((value) => value === "medium").length;
  if (no >= 2 || draft.flags.length >= 2) return "nonConcluant";
  if (no === 0 && medium <= 1 && draft.flags.length === 0) return "concluant";
  return "toReview";
}

// Le compte-rendu envoyé : le brouillon plus qui, quand, et la décision.
export function buildReport(draft, decision, leader) {
  const reached = decision !== "injoignable";
  return {
    decision,
    mode: draft.mode,
    reachable: reached,
    ratings: reached ? { ...draft.ratings } : {},
    flags: reached ? [...draft.flags] : [],
    reasons: decision === "nonConcluant" ? [...draft.reasons] : [],
    comment: draft.comment.trim().slice(0, COMMENT_MAX),
    leaderId: leader?.leaderId ?? null,
    leaderName: leader?.leaderName ?? "",
    at: new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------
// Délai de rendu

// Date limite d'un dossier attribué (celle enregistrée, sinon 7 jours après
// l'attribution pour les dossiers plus anciens).
export function dueDateOf(assignment) {
  if (!assignment) return null;
  if (assignment.dueDate) return assignment.dueDate;
  if (!assignment.assignedAt) return null;
  return dayjs(assignment.assignedAt).add(DEADLINE_DAYS, "day").toISOString();
}

// { due, daysLeft, overdue, soon } : "daysLeft" est négatif quand le délai
// est dépassé ; "soon" quand il reste REMINDER_DAYS jours ou moins.
export function deadlineState(assignment, now = dayjs()) {
  const due = dueDateOf(assignment);
  if (!due) return null;
  const daysLeft = dayjs(due).startOf("day").diff(now.startOf("day"), "day");
  return { due, daysLeft, overdue: daysLeft < 0, soon: daysLeft >= 0 && daysLeft <= REMINDER_DAYS };
}

// Où en est le dossier du point de vue de l'entretien ?
//   "todo"        : pas encore de compte-rendu ;
//   "unreachable" : le candidat n'a pas pu être joint (le leader peut réessayer) ;
//   "done"        : compte-rendu rendu, entretien concluant ;
//   "refused"     : compte-rendu rendu, entretien non concluant.
export function interviewStage(registration) {
  const decision = registration.interview?.decision;
  if (decision === "concluant") return "done";
  if (decision === "nonConcluant") return "refused";
  if (decision === "injoignable") return "unreachable";
  return "todo";
}
