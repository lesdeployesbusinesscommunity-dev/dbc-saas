// ----------------------------------------------------------------------
// Le DOSSIER DE RELANCE confié au chef d'antenne (le "Community Manager
// Financier" de la relance automatique, niveau 2 : voir escalation.js). Il
// joue le même rôle que l'entretien d'une inscription : le chef d'antenne
// contacte le membre en retard, comprend sa situation, propose une solution, et
// rend un RAPPORT à cocher. Tout est à cocher, avec seulement un commentaire
// facultatif d'une ligne ; l'administration lit le rapport.

export const FOLLOW_UP_MODES = ["whatsapp", "call", "inPerson"];

// Pourquoi le membre est en retard (une seule cause principale).
export const FOLLOW_UP_CAUSES = ["forgot", "temporary", "health", "dispute", "unwilling", "other"];

// La solution convenue avec le membre.
export const FOLLOW_UP_SOLUTIONS = ["payNow", "grace", "partial", "arrangement", "none"];

export const FOLLOW_UP_COMMENT_MAX = 140;

export const emptyFollowUpDraft = () => ({
  mode: null,
  reachable: null,
  cause: null,
  solution: null,
  promiseDate: "",
  comment: "",
});

// Le rapport peut-il être envoyé ? Membre joint : il faut une cause et une
// solution. Membre injoignable : il suffit d'avoir dit comment on a essayé.
export function followUpReady(draft) {
  if (!draft.mode || draft.reachable === null) return false;
  if (draft.reachable === false) return true;
  return Boolean(draft.cause && draft.solution);
}

// Le rapport rendu : le brouillon plus qui, quand, et le nombre d'essais.
export function buildFollowUpReport(draft, leaderName, previousAttempts = 0) {
  const reached = draft.reachable === true;
  return {
    mode: draft.mode,
    reachable: reached,
    cause: reached ? draft.cause : null,
    solution: reached ? draft.solution : null,
    promiseDate: reached && draft.solution !== "none" ? draft.promiseDate || "" : "",
    comment: draft.comment.trim().slice(0, FOLLOW_UP_COMMENT_MAX),
    leaderName,
    at: new Date().toISOString(),
    attempts: previousAttempts + 1,
  };
}

// L'état d'un dossier de relance : "todo" (à mener), "unreachable" (membre
// injoignable, le chef d'antenne peut réessayer), "done" (membre joint, rapport
// rendu), ou "unassigned" (aucun chef d'antenne trouvé : l'administration en
// désigne un).
export function followUpStage(entry) {
  if (!entry?.assignment) return "unassigned";
  if (entry.status === "done") return "done";
  return entry.report && entry.report.reachable === false ? "unreachable" : "todo";
}
