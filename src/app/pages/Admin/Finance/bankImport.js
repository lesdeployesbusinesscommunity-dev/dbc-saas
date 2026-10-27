// Lecture d'un historique bancaire au format CSV (export de la banque, ou
// modèle téléchargeable depuis la page). Aucune dépendance : le fichier est lu
// dans le navigateur, rien n'est envoyé nulle part.

// Colonnes reconnues (français ou anglais, accents et majuscules ignorés).
const ALIASES = {
  date: ["date", "datedoperation", "datevaleur", "dateoperation"],
  account: ["compte", "account"],
  label: ["libelle", "label", "description", "motif", "intitule"],
  amount: ["montant", "amount"],
  debit: ["debit", "sortie", "sorties"],
  credit: ["credit", "entree", "entrees"],
  initiator: ["initiateur", "initiator", "emetteur", "donneurdordre", "ordonnateur"],
  recipient: ["destinataire", "recipient", "beneficiaire", "beneficiary"],
  reference: ["reference", "ref"],
  status: ["statut", "status", "etat"],
  balance: ["solde", "balance", "soldeapres"],
  signer1: ["signataire1", "signer1", "signature1"],
  signer2: ["signataire2", "signer2", "signature2"],
};

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Découpe le texte CSV (guillemets, séparateur "," ";" ou tabulation).
export function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const counts = { ";": 0, ",": 0, "\t": 0 };
  let quoted = false;
  for (const char of firstLine) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) counts[char] += 1;
  }
  const separator = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

  const rows = [];
  let row = [];
  let cell = "";
  quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (quoted) {
      if (char === '"' && clean[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === separator) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((items) => items.some((item) => item.trim() !== ""));
}

export function parseAmount(raw) {
  let text = String(raw ?? "").trim();
  if (!text) return null;
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  text = text.replace(/[−–—]/g, "-").replace(/fcfa|xaf|xof|f\b/gi, "").replace(/[\s\u00a0\u202f']/g, "");
  if (text.startsWith("-")) {
    negative = !negative;
    text = text.slice(1);
  }
  if (text.startsWith("+")) text = text.slice(1);
  // Un séparateur suivi d'un ou deux chiffres en fin de nombre = décimales ; sinon milliers.
  const decimal = text.match(/^(.*)[.,](\d{1,2})$/);
  text = decimal ? `${decimal[1].replace(/[.,]/g, "")}.${decimal[2]}` : text.replace(/[.,]/g, "");
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const value = Math.round(Number(text));
  return negative ? -value : value;
}

export function parseDate(raw) {
  const text = String(raw ?? "").trim();
  let year;
  let month;
  let day;
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) [, year, month, day] = match;
  else if ((match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) [, day, month, year] = match;
  else return null;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const STATUS = { confirmed: "confirmed", confirmee: "confirmed", valide: "confirmed", validee: "confirmed", pending: "pending", encours: "pending", attente: "pending", enattente: "pending" };

export const dedupeKey = (row) => (row.reference ? `ref:${row.reference}` : `${row.date}|${row.account}|${row.amount}|${normalize(row.label)}`);

// Lit le texte du fichier. Renvoie les lignes valides, les erreurs (avec le
// numéro de ligne du fichier) et le nombre de doublons ignorés.
// "known" = lignes déjà importées (pour ne pas les ajouter deux fois).
export function readBankCsv(text, known = []) {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], errors: [], duplicates: 0, fatal: "empty" };

  const header = table[0].map(normalize);
  const col = {};
  Object.entries(ALIASES).forEach(([field, names]) => {
    const index = header.findIndex((name) => names.includes(name));
    if (index >= 0) col[field] = index;
  });
  const hasAmount = col.amount !== undefined || (col.debit !== undefined && col.credit !== undefined);
  if (col.date === undefined || col.account === undefined || col.label === undefined || !hasAmount) {
    return { rows: [], errors: [], duplicates: 0, fatal: "columns" };
  }

  const seen = new Set(known.map(dedupeKey));
  const rows = [];
  const errors = [];
  let duplicates = 0;
  table.slice(1).forEach((cells, offset) => {
    const line = offset + 2;
    const get = (field) => (col[field] === undefined ? "" : String(cells[col[field]] ?? "").trim());

    const date = parseDate(get("date"));
    if (!date) return errors.push({ line, error: "date" });
    const accountId = get("account").toUpperCase().replace(/^COMPTE\s*/, "").slice(0, 1);
    if (!["A", "B", "C"].includes(accountId)) return errors.push({ line, error: "account" });
    const label = get("label");
    if (!label) return errors.push({ line, error: "label" });

    let amount;
    if (col.amount !== undefined) amount = parseAmount(get("amount"));
    else {
      const credit = parseAmount(get("credit")) ?? 0;
      const debit = parseAmount(get("debit")) ?? 0;
      amount = get("credit") || get("debit") ? credit - Math.abs(debit) : null;
    }
    if (amount === null || amount === 0 || Number.isNaN(amount)) return errors.push({ line, error: "amount" });

    const balance = get("balance") ? parseAmount(get("balance")) : null;
    const signers = [get("signer1"), get("signer2")].filter(Boolean).map((name) => ({ name }));
    const row = {
      account: accountId,
      date,
      label,
      amount,
      initiator: get("initiator") ? { name: get("initiator") } : null,
      recipient: get("recipient") ? { name: get("recipient") } : null,
      signers,
      ...(get("reference") ? { reference: get("reference") } : {}),
      ...(STATUS[normalize(get("status"))] ? { status: STATUS[normalize(get("status"))] } : {}),
      ...(balance !== null ? { bankBalance: balance } : {}),
    };
    const key = dedupeKey(row);
    if (seen.has(key)) {
      duplicates += 1;
      return undefined;
    }
    seen.add(key);
    rows.push(row);
    return undefined;
  });
  return { rows, errors, duplicates, fatal: null };
}

// Modèle téléchargeable (séparateur ";", s'ouvre directement dans Excel en français).
export const CSV_TEMPLATE = [
  "date;compte;libelle;montant;initiateur;destinataire;reference;statut;signataire1;signataire2",
  "2026-10-02;A;Abonnements des membres;1940000;Membres DBC;Compte A;A-0001;confirmee;;",
  "2026-10-10;B;Versement au Fonds de Réserve;-707000;Hubert Wakap;Compte C;B-0002;confirmee;Hubert Wakap;Mireille Tchoumi",
].join("\r\n");
