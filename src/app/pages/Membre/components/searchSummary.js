// Import Dependencies
import { useCallback, useEffect, useState } from "react";

// ----------------------------------------------------------------------

// Recherche de l'en-tête (voir Dashboard/TopBar.jsx) : quand une page a
// plusieurs listes filtrées, une liste sans correspondance DISPARAÎT en
// silence (un pavé "aucun résultat" par section serait du bruit), et la
// PAGE n'affiche qu'un seul message quand plus aucune liste ne correspond.
// Pour que la page le sache, chaque section lui signale combien de lignes
// elle montre :
//
//   page :     const { report, noResults } = useSearchSummary(query);
//              <Section query={query} onMatches={report} />
//   section :  useReportMatches(onMatches, "tracking", rows.length);
//              if (hasQuery && rows.length === 0) return null;
//
// "noResults" n'est vrai que si une recherche est en cours ET que toutes
// les sections qui se sont signalées sont à zéro.
export function useSearchSummary(query) {
  const [counts, setCounts] = useState({});

  const report = useCallback((id, count) => {
    setCounts((current) => {
      if (count === null) {
        if (!(id in current)) return current;
        const { [id]: removed, ...rest } = current;
        void removed;
        return rest;
      }
      return current[id] === count ? current : { ...current, [id]: count };
    });
  }, []);

  const values = Object.values(counts);
  const noResults = query.trim() !== "" && values.length > 0 && values.every((n) => n === 0);

  return { report, noResults };
}

// À appeler par chaque section filtrée : signale son nombre de lignes à la
// page, et se retire du décompte quand elle disparaît de l'écran.
export function useReportMatches(report, id, count) {
  useEffect(() => {
    report?.(id, count);
  }, [report, id, count]);

  useEffect(() => () => report?.(id, null), [report, id]);
}
