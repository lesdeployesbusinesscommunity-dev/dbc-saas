// Import Dependencies
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Construit la liste des boutons à afficher : toutes les pages si elles
// tiennent (<= 7), sinon 1 … [voisines de la page courante] … dernière —
// même logique que la pagination de la maquette de référence (chevrons +
// numéros + "…").
function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withGaps = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) withGaps.push("…");
    withGaps.push(page);
  });
  return withGaps;
}

export function Pagination({ page, pageCount, onChange }) {
  const { t } = useTranslation();

  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={t("admin.membres.pagination.label")}
      className="mt-6 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label={t("admin.membres.pagination.prev")}
        className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
      </button>

      {buildPageList(page, pageCount).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="px-1.5 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={clsx(
              "flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
              item === page
                ? "bg-[#52A2DF] text-white"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        aria-label={t("admin.membres.pagination.next")}
        className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRightIcon aria-hidden="true" className="size-4" />
      </button>
    </nav>
  );
}
