// Import Dependencies
import { useSyncExternalStore } from "react";

// Local Imports
import { DEADLINE_DAYS, buildReport } from "app/pages/Membre/Leader/interviewModel";

// ----------------------------------------------------------------------
// Registre des DEMANDES D'INSCRIPTION, gardé dans le navigateur
// (localStorage, protégé par try/catch, mis à jour entre onglets) en
// attendant le backend — même principe que Membres/membersStore.js. C'est
// ce qui relie le formulaire public "Rejoindre la DBC" (voir
// Inscription/index.jsx, qui appelle addRegistration) à la page admin
// "Demandes d'inscription" (voir Admin/Inscriptions/index.jsx).
//
// Une demande suit ce parcours :
//   "nouvelle"  : reçue, personne ne s'en occupe encore ;
//   "entretien" : attribuée à un leader d'antenne (de préférence du même
//                 pays) qui mène l'entretien, puis rend un COMPTE-RENDU à
//                 cocher dans son espace leader (voir "interview") ;
//   "acceptee"  : l'entretien est concluant, l'administration a créé le
//                 membre (voir "memberId" / "matricule") ;
//   "refusee"   : candidature refusée par l'administration ("refusal") ou
//                 entretien non concluant ("interview").
// Le bouton "Ajouter" n'est disponible qu'une fois le compte-rendu rendu
// avec la décision "concluant".
//
// Forme d'une demande :
// { id, ref, createdAt, nom, prenom, email, dateNaissance, cni, pays,
//   ville, whatsapp, tontine (clé de niveau), travail, parrain (matricule),
//   parrainParDefaut (true quand aucun parrain n'a été indiqué : "parrain" vaut
//   alors DEFAULT_SPONSOR, l'administration),
//   justificatif ({ name, type, size, dataUrl } : le document qui prouve
//   l'activité déclarée, voir proofUtils.js ; absent des demandes déposées avant
//   son ajout),
//   status, assignment: { leaderId, leaderName, nodeId, branchName,
//   location, country, interviewDate, note, assignedAt, dueDate } | null,
//   interview: { decision ("concluant" | "nonConcluant" | "injoignable"),
//   mode, reachable, ratings, flags, reasons, comment, attempts, at,
//   leaderId, leaderName } | null,
//   memberId, matricule, decidedAt, refusal }
const STORAGE_KEY = "dbc-registrations-v1";

// Sans parrain indiqué dans le formulaire, l'administration DBC (compte
// administrateur : Hubert Wakap) devient le parrain de la personne.
export const DEFAULT_SPONSOR = "DBC-1-0001";

export const REGISTRATION_STATUSES = ["nouvelle", "entretien", "acceptee", "refusee"];

const DAY = 24 * 60 * 60 * 1000;

// Date limite du compte-rendu : DEADLINE_DAYS jours après l'attribution.
const dueFrom = (assignedAt) =>
  new Date((assignedAt ? new Date(assignedAt).getTime() : Date.now()) + DEADLINE_DAYS * DAY).toISOString();

// Demandes de démonstration : pour que la page ne soit pas vide avant la
// première vraie inscription (coordonnées et numéros inventés).
function buildSeed() {
  const now = Date.now();
  const make = (n, daysAgo, data) => ({
    id: `r-seed-${n}`,
    ref: `INS-${String(n).padStart(4, "0")}`,
    createdAt: new Date(now - daysAgo * DAY).toISOString(),
    status: "nouvelle",
    assignment: null,
    interview: null,
    memberId: null,
    matricule: null,
    decidedAt: null,
    refusal: null,
    ...data,
  });

  return [
    make(1, 1, {
      nom: "Ngono",
      prenom: "Estelle",
      email: "estelle.ngono@example.com",
      dateNaissance: "1992-04-17",
      cni: "118273645",
      pays: "Cameroun",
      ville: "Douala",
      whatsapp: "+237 600 00 00 11",
      tontine: "starter",
      travail: "Couturière et créatrice de mode",
      parrain: "DBC-1-0001",
    }),
    make(2, 2, {
      nom: "Diallo",
      prenom: "Mamadou",
      email: "mamadou.diallo@example.com",
      dateNaissance: "1988-09-02",
      cni: "SN-4471982",
      pays: "Sénégal",
      ville: "Dakar",
      whatsapp: "+221 700 00 00 12",
      tontine: "batisseur",
      travail: "Commerçant import-export",
      parrain: "DBC-1-0002",
    }),
    make(3, 3, {
      nom: "Kamga",
      prenom: "Brice",
      email: "brice.kamga@example.com",
      dateNaissance: "1995-12-30",
      cni: "119845203",
      pays: "Cameroun",
      ville: "Yaoundé",
      whatsapp: "+237 600 00 00 13",
      tontine: "starter",
      travail: "Développeur web freelance",
      parrain: "DBC-1-0042",
    }),
    make(4, 5, {
      nom: "Traoré",
      prenom: "Fanta",
      email: "fanta.traore@example.com",
      dateNaissance: "1990-06-11",
      cni: "ML-2230918",
      pays: "Mali",
      ville: "Bamako",
      whatsapp: "+223 700 00 00 14",
      tontine: "batisseurPro",
      travail: "Gérante d'une boutique de cosmétiques",
      parrain: "DBC-1-0003",
      status: "entretien",
      assignment: {
        leaderId: "m4",
        leaderName: "Aïcha Konaté",
        nodeId: null,
        branchName: "",
        location: "",
        country: "Mali",
        isNational: true,
        interviewDate: new Date(now + 2 * DAY).toISOString().slice(0, 10),
        note: "Vérifier sa disponibilité pour la cotisation mensuelle.",
        assignedAt: new Date(now - 4 * DAY).toISOString(),
        dueDate: new Date(now + 3 * DAY).toISOString(),
      },
      // Entretien déjà rendu par la leader (compte-rendu concluant) : on peut
      // donc ajouter ce membre sans attendre.
      interview: {
        decision: "concluant",
        mode: "call",
        reachable: true,
        ratings: { tontine: "yes", contribution: "yes", project: "medium", consistency: "yes", motivation: "yes" },
        flags: [],
        reasons: [],
        comment: "Très motivée, déjà membre d'une tontine locale.",
        attempts: 1,
        at: new Date(now - 1 * DAY).toISOString(),
        leaderId: "m4",
        leaderName: "Aïcha Konaté",
      },
    }),
    make(5, 6, {
      nom: "Koffi",
      prenom: "Yao",
      email: "yao.koffi@example.com",
      dateNaissance: "1985-01-25",
      cni: "CI-0098127",
      pays: "Côte d'Ivoire",
      ville: "Abidjan",
      whatsapp: "+225 070 00 00 15",
      tontine: "performer",
      travail: "Entrepreneur agricole (cacao)",
      parrain: "DBC-1-0001",
    }),
    make(6, 8, {
      nom: "Mbarga",
      prenom: "Carine",
      email: "carine.mbarga@example.com",
      dateNaissance: "1993-03-08",
      cni: "117362914",
      pays: "Cameroun",
      ville: "Bafoussam",
      whatsapp: "+237 600 00 00 16",
      tontine: "batisseur",
      travail: "Infirmière libérale",
      parrain: "DBC-1-0003",
      status: "refusee",
      decidedAt: new Date(now - 3 * DAY).toISOString(),
      refusal: "Entretien non concluant : projet professionnel pas assez clair.",
    }),
    make(7, 10, {
      nom: "Lefèvre",
      prenom: "Julien",
      email: "julien.lefevre@example.com",
      dateNaissance: "1987-11-19",
      cni: "FR-23AB45678",
      pays: "France",
      ville: "Lyon",
      whatsapp: "+33 600 00 00 17",
      tontine: "starter",
      travail: "Consultant en marketing digital",
      parrain: "",
    }),
    ...buildLeaderCaseSeed(make, now),
  ];
}

// Un dossier déjà attribué à Nadège Mbarga (leader de l'Antenne Centre), pour
// que son espace leader ne soit pas vide au premier essai : id "r-seed-8".
function buildLeaderCaseSeed(make, now) {
  return [
    make(8, 2, {
      nom: "Nkoulou",
      prenom: "Rose",
      email: "rose.nkoulou@example.com",
      dateNaissance: "1991-07-23",
      cni: "116402857",
      pays: "Cameroun",
      ville: "Yaoundé",
      whatsapp: "+237 600 00 00 18",
      tontine: "starter",
      travail: "Gérante d'un salon de coiffure",
      parrain: "DBC-1-0003",
      status: "entretien",
      assignment: {
        leaderId: "m5",
        leaderName: "Nadège Mbarga",
        photo: null,
        nodeId: null,
        branchName: "Antenne Centre",
        location: "Yaoundé",
        country: "Cameroun",
        isNational: false,
        depth: 1,
        interviewDate: "",
        note: "Elle souhaite cotiser dès le mois prochain : vérifier qu'elle a bien compris le principe.",
        assignedAt: new Date(now - 1 * DAY).toISOString(),
        dueDate: new Date(now + 6 * DAY).toISOString(),
      },
    }),
  ];
}

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.items)) {
      // Les demandes de démonstration enregistrées avant l'ajout d'un champ le
      // retrouvent ici ("ville", compte-rendu d'entretien, date limite) ; les
      // vraies demandes ne sont pas touchées, sauf pour la date limite d'un
      // dossier déjà attribué (7 jours après l'attribution).
      const seed = buildSeed();
      const items = saved.items.map((item) => {
        const demo = seed.find((entry) => entry.id === item.id);
        let next = item;
        if (next.ville === undefined) next = { ...next, ville: demo?.ville ?? "" };
        if (next.interview === undefined) next = { ...next, interview: demo?.interview ?? null };
        if (next.assignment && !next.assignment.dueDate) {
          next = {
            ...next,
            assignment: { ...next.assignment, dueDate: dueFrom(next.assignment.assignedAt) },
          };
        }
        return next;
      });
      // Le dossier de démonstration du leader, ajouté une seule fois.
      if (!saved.leaderCase) {
        const leaderCase = seed.find((entry) => entry.id === "r-seed-8");
        if (leaderCase && !items.some((item) => item.id === leaderCase.id)) items.push(leaderCase);
      }
      return { items, leaderCase: true };
    }
  } catch {
    // stockage illisible : on repart des demandes de démonstration
  }
  return { items: buildSeed(), leaderCase: true };
}

let state = typeof window === "undefined" ? { items: buildSeed(), leaderCase: true } : load();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

// Écrit dans le navigateur ; false si le stockage est indisponible ou plein.
function save(next = state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    // stockage indisponible : les changements restent valables pour cette session
    return false;
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

function getState() {
  return state;
}

function commit(items) {
  state = { ...state, items };
  save();
  emit();
}

const patch = (id, changes) =>
  commit(state.items.map((item) => (item.id === id ? { ...item, ...changes } : item)));

// Les demandes, de la plus récente à la plus ancienne.
export function useRegistrations() {
  const snapshot = useSyncExternalStore(subscribe, getState, getState);
  return snapshot.items;
}

// Pour le calcul hors composant (fil de notifications, tests).
export function getRegistrations() {
  return state.items;
}

// ----------------------------------------------------------------------
// Écritures

// Appelée par le formulaire public à l'envoi : enregistre la demande,
// "nouvelle", avec un numéro de dossier suivant (INS-0008...). Renvoie null si
// le navigateur n'a plus la place de garder le justificatif joint : la demande
// n'est alors pas enregistrée et le formulaire le dit (le backend recevra le
// fichier, cette limite disparaîtra).
export function addRegistration(form) {
  const last = state.items.reduce((max, item) => {
    const n = parseInt(String(item.ref).replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  const registration = {
    id: `r-${Date.now()}`,
    ref: `INS-${String(last + 1).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    nom: form.nom.trim(),
    prenom: form.prenom.trim(),
    email: form.email.trim(),
    dateNaissance: form.dateNaissance,
    cni: form.cni.trim(),
    pays: form.pays,
    ville: (form.ville ?? "").trim(),
    whatsapp: form.whatsapp.trim(),
    tontine: form.tontine,
    travail: form.travail.trim(),
    parrain: form.parrain.trim().toUpperCase() || DEFAULT_SPONSOR,
    parrainParDefaut: !form.parrain.trim(),
    justificatif: form.justificatif ?? null,
    status: "nouvelle",
    assignment: null,
    interview: null,
    memberId: null,
    matricule: null,
    decidedAt: null,
    refusal: null,
  };
  const items = [registration, ...state.items];
  if (registration.justificatif && !save({ ...state, items })) return null;
  commit(items);
  return registration;
}

// Attribue (ou réattribue) la demande à un leader pour l'entretien :
// "leader" = { leaderId, leaderName, nodeId, branchName, location,
// country }, avec une date d'entretien et une note facultatives.
//
// Un nouveau leader repart de zéro : l'ancien compte-rendu est écarté et le
// délai de 7 jours recommence.
export function assignRegistration(id, { leader, interviewDate = "", note = "" }) {
  const assignedAt = new Date().toISOString();
  patch(id, {
    status: "entretien",
    interview: null,
    assignment: {
      ...leader,
      interviewDate,
      note: note.trim(),
      assignedAt,
      dueDate: dueFrom(assignedAt),
    },
  });
}

// Le compte-rendu du leader (voir Membre/Leader/interviewModel.js) :
// - "concluant"    : le dossier reste en "entretien" et l'administration peut
//                    maintenant ajouter le membre ;
// - "nonConcluant" : la candidature est refusée, le compte-rendu en garde la
//                    trace (raisons cochées, commentaire) ;
// - "injoignable"  : le dossier reste ouvert, le leader peut réessayer et
//                    l'administration peut réattribuer.
export function submitInterviewReport(id, draft, decision) {
  const current = state.items.find((item) => item.id === id);
  if (!current || !current.assignment) return null;
  const report = {
    ...buildReport(draft, decision, current.assignment),
    attempts: (current.interview?.attempts ?? 0) + 1,
  };
  patch(id, {
    interview: report,
    ...(decision === "nonConcluant"
      ? { status: "refusee", decidedAt: report.at, refusal: null }
      : {}),
  });
  return report;
}

// L'entretien est bon et le membre a été créé : la demande est "acceptée".
export function markRegistrationAccepted(id, { memberId, matricule }) {
  patch(id, {
    status: "acceptee",
    memberId,
    matricule,
    decidedAt: new Date().toISOString(),
    refusal: null,
  });
}

export function refuseRegistration(id, reason = "") {
  patch(id, {
    status: "refusee",
    decidedAt: new Date().toISOString(),
    refusal: reason.trim() || null,
  });
}
