// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Message affiché quand la recherche de l'en-tête (voir Dashboard/TopBar.jsx)
// ne trouve rien dans une section. Chaque section filtrable de chaque page
// l'affiche à la place de sa liste, pour que "rien" ne ressemble jamais à
// une page cassée. N'apparaît que si une recherche est en cours : une liste
// vide sans recherche garde son propre message.
export function SearchEmpty({ query, className }) {
  const { t } = useTranslation();

  if (query.trim() === "") return null;

  return (
    <p
      className={clsx(
        "rounded-2xl border border-dashed border-black/10 bg-white/60 px-4 py-5 text-center text-sm text-gray-500",
        className,
      )}
    >
      {t("membre.search.noResults", { query: query.trim() })}
    </p>
  );
}
