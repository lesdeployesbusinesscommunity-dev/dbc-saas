// Import Dependencies
import dayjs from "dayjs";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { financeByLevel } from "./mockData";

// ----------------------------------------------------------------------
// Les comptes bancaires de la DBC et leur historique (données de démonstration,
// en attendant la banque / le backend). Toute la protection de l'argent des
// membres repose sur cette séparation :
//
//   Compte A — Opérations DBC : abonnements, commissions, frais de fonctionnement.
//   Compte B — Tontine Royale (INTOUCHABLE) : les cotisations mensuelles des
//              membres, rien d'autre.
//   Compte C — Fonds de Réserve de Solidarité (INTOUCHABLE) : 5 % des
//              cotisations mensuelles.
//
// Les comptes B et C sont juridiquement protégés : ils ne peuvent pas servir à
// couvrir des frais d'exploitation, même en cas de crise de la DBC, et chaque
// mouvement SORTANT exige la double signature du Fondateur et d'un membre du
// Comité de Gouvernance élu par les membres de ce comité. Ici, toute sortie des
// comptes B et C porte donc "signed: true".
//
// Les montants de cotisations du mois collent à "Gestion des tontines"
// (mockData.js : cotisations reçues × cotisation du niveau). Les soldes ne sont
// pas écrits en dur : ils sont CALCULÉS à partir du solde d'ouverture et des
// mouvements, donc toujours cohérents avec l'historique affiché.

export const RESERVE_RATE = 0.05;

export const ACCOUNTS = [
  { id: "A", locked: false, opening: 3600000 },
  { id: "B", locked: true, opening: 4200000 },
  { id: "C", locked: true, opening: 2800000 },
];

const FIRST_MONTH = "2026-06-01";
const MONTH_COUNT = 5;
// Les cotisations grossissent au fil des mois (nouveaux membres).
const GROWTH = [0.82, 0.88, 0.93, 0.97, 1];
const SUBSCRIPTIONS = [1650000, 1720000, 1810000, 1880000, 1940000];
const OPERATING = [610000, 625000, 640000, 655000, 660000];
const STAFF = [920000, 920000, 950000, 950000, 980000];
const SPONSOR = [430000, 455000, 480000, 510000, 520000];

const roundK = (value) => Math.round(value / 1000) * 1000;

// Intervenants de démonstration (données fictives). Le Fondateur et un membre du
// Comité de Gouvernance cosignent toute sortie des comptes B et C.
const FOUNDER = { name: "Hubert Wakap", role: "founder" };
const COMMITTEE = { name: "Mireille Tchoumi", role: "committee" };
const SIGNERS = [FOUNDER, COMMITTEE];
const BENEFICIARIES = [
  "Thierry Mbida",
  "Nadège Kamga",
  "Rodrigue Ndzié",
  "Carine Fotso",
  "Arnauld Tagne",
  "Sandrine Biyick",
  "Yannick Essomba",
  "Laure Nkoulou",
  "Patrick Owona",
  "Estelle Manga",
];
const person = (name) => ({ name });
const label = (key, params) => ({ key, ...(params ? { params } : {}) });
const acct = (id) => ({ account: id });

function build() {
  const rows = [];
  const push = (row) => rows.push({ ...row, id: `tx-${rows.length + 1}` });
  const payable = levels.filter((level) => financeByLevel[level.key]?.contributionsReceived > 0);

  for (let m = 0; m < MONTH_COUNT; m += 1) {
    const month = dayjs(FIRST_MONTH).add(m, "month");
    const day = (n) => month.date(n).format("YYYY-MM-DD");
    const monthLabel = month.format("YYYY-MM");
    const params = { month: month.format("YYYY-MM-01") };

    // Compte A
    const mgmt = label("management");
    push({ account: "A", date: day(3), kind: "subscriptions", amount: SUBSCRIPTIONS[m], params, initiator: label("members"), recipient: acct("A") });
    push({ account: "A", date: day(5), kind: "operating", amount: -OPERATING[m], params, initiator: mgmt, recipient: label("suppliers") });
    push({ account: "A", date: day(25), kind: "staff", amount: -STAFF[m], params, initiator: mgmt, recipient: label("team") });
    push({ account: "A", date: day(27), kind: "sponsor", amount: -SPONSOR[m], params, initiator: mgmt, recipient: label("sponsors") });
    push({ account: "A", date: day(29), kind: "bankFees", amount: -(18000 + m * 500), params, initiator: label("bank"), recipient: label("bank") });

    // Compte B : une cotisation encaissée par niveau, puis le prélèvement de 5 %,
    // puis le versement de la cagnotte aux bénéficiaires.
    let total = 0;
    payable.forEach((level, index) => {
      const amount = roundK(financeByLevel[level.key].contributionsReceived * level.cotisation * GROWTH[m]);
      total += amount;
      push({
        account: "B",
        date: day(1 + index),
        kind: "contributions",
        amount,
        params: { ...params, level: level.key },
        initiator: label("levelMembers", { level: level.key }),
        recipient: acct("B"),
      });
    });
    const reserve = roundK(total * RESERVE_RATE);
    push({ account: "B", date: day(10), kind: "reserveOut", amount: -reserve, signers: SIGNERS, params, initiator: person(FOUNDER.name), recipient: acct("C") });
    push({ account: "C", date: day(10), kind: "reserveIn", amount: reserve, params, initiator: acct("B"), recipient: acct("C") });
    payable.forEach((level, index) => {
      const received = rows.find((row) => row.kind === "contributions" && row.params.level === level.key && row.params.month === params.month);
      const payout = received.amount - roundK(received.amount * RESERVE_RATE);
      push({
        account: "B",
        date: day(11 + index),
        kind: "payout",
        amount: -payout,
        signers: SIGNERS,
        initiator: person(FOUNDER.name),
        recipient: person(BENEFICIARIES[(levels.indexOf(level) * 3 + m) % BENEFICIARIES.length]),
        params: { ...params, level: level.key, tour: Math.max(1, financeByLevel[level.key].toursCompleted - (MONTH_COUNT - 1 - m) + 1) },
      });
    });

    // Compte C : une seule sortie, en août (couverture solidaire d'un membre).
    if (monthLabel === "2026-08") {
      push({
        account: "C",
        date: day(18),
        kind: "solidarity",
        amount: -120000,
        signers: SIGNERS,
        params,
        initiator: person(FOUNDER.name),
        recipient: person(BENEFICIARIES[7]),
      });
    }
  }

  // Seules les opérations déjà passées apparaissent : la banque ne connaît pas l'avenir.
  const today = dayjs().format("YYYY-MM-DD");
  return finalize(rows.filter((row) => row.date <= today));
}

// Trie, calcule les soldes courants, la référence, le statut et l'état des
// signatures. Sert aussi bien aux données de démonstration qu'à l'historique
// importé : une ligne peut déjà porter sa "reference", son "status" ou le solde
// donné par la banque ("bankBalance") ; sinon on les calcule.
export function finalize(rows, openings = Object.fromEntries(ACCOUNTS.map((item) => [item.id, item.opening]))) {
  const sorted = rows
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  const balance = { ...openings };
  const pendingFrom = dayjs().subtract(2, "day").format("YYYY-MM-DD");
  return sorted.map((row, index) => {
    balance[row.account] = Number.isFinite(row.bankBalance) ? row.bankBalance : (balance[row.account] ?? 0) + row.amount;
    const locked = ACCOUNTS.find((item) => item.id === row.account)?.locked;
    const signed = (row.signers?.length ?? 0) >= 2;
    return {
      ...row,
      signed,
      // Sortie d'un compte intouchable sans les deux signatures : à signaler.
      unsigned: Boolean(locked) && row.amount < 0 && !signed,
      balanceAfter: balance[row.account],
      status: row.status ?? (row.date > pendingFrom ? "pending" : "confirmed"),
      reference: row.reference ?? `${row.account}-${row.date.replaceAll("-", "")}-${String(index + 1).padStart(4, "0")}`,
    };
  });
}

// L'historique complet, du plus ancien au plus récent.
export const bankTransactions = build();

export function accountSummary(accountId, transactions = bankTransactions, openings) {
  const opening = openings ? (openings[accountId] ?? 0) : ACCOUNTS.find((item) => item.id === accountId).opening;
  const own = transactions.filter((row) => row.account === accountId);
  // "Le mois" = celui de la dernière opération connue (le mois en cours pour les
  // données de démonstration, le dernier mois du relevé pour un historique importé).
  const thisMonth = (transactions[transactions.length - 1]?.date ?? dayjs().format("YYYY-MM-DD")).slice(0, 7);
  const month = own.filter((row) => row.date.startsWith(thisMonth));
  return {
    balance: own.length ? own[own.length - 1].balanceAfter : opening,
    monthIn: month.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0),
    monthOut: Math.abs(month.filter((row) => row.amount < 0).reduce((sum, row) => sum + row.amount, 0)),
  };
}
