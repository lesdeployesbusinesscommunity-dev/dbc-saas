// Import Dependencies
import { useMemo, useSyncExternalStore } from "react";

// Local Imports
import { ACCOUNTS, bankTransactions, finalize } from "./bankData";
import { dedupeKey } from "./bankImport";

// ----------------------------------------------------------------------
// Historique importé par l'administrateur. Tant qu'aucun fichier n'a été
// importé, la page montre l'historique de démonstration ; dès qu'un import
// existe, il REMPLACE la démonstration (un relevé réel ne se mélange pas à des
// données fictives). Rien ne quitte le navigateur (localStorage) en attendant
// le backend.

const KEY = "dbc-bank-import-v1";
const EMPTY = { rows: [], importedAt: null };

let state = load();
const listeners = new Set();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && Array.isArray(parsed.rows)) return parsed;
  } catch {
    // stockage indisponible ou contenu abîmé : on repart de zéro
  }
  return EMPTY;
}

function commit(next) {
  state = next;
  try {
    if (next.rows.length) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // quota ou mode privé : l'import reste valable pour cette session
  }
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    state = load();
    listeners.forEach((listener) => listener());
  });
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

export function addImportedRows(rows) {
  const known = new Set(state.rows.map(dedupeKey));
  const fresh = rows.filter((row) => !known.has(dedupeKey(row)));
  const base = state.rows.length;
  commit({
    rows: [...state.rows, ...fresh.map((row, index) => ({ ...row, id: `imp-${base + index + 1}` }))],
    importedAt: new Date().toISOString(),
  });
  return fresh.length;
}

export function clearImportedRows() {
  commit(EMPTY);
}

// Les opérations affichées (+ soldes de départ de chaque compte).
export function useBankData() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return useMemo(() => {
    if (!snapshot.rows.length) {
      return {
        imported: false,
        importedCount: 0,
        transactions: bankTransactions,
        openings: Object.fromEntries(ACCOUNTS.map((item) => [item.id, item.opening])),
        importedRows: [],
      };
    }
    const openings = { A: 0, B: 0, C: 0 };
    return {
      imported: true,
      importedCount: snapshot.rows.length,
      transactions: finalize(snapshot.rows, openings),
      openings,
      importedRows: snapshot.rows,
    };
  }, [snapshot]);
}
