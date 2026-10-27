// Import Dependencies
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { StatusBadge } from "./StatusBadge";

// ----------------------------------------------------------------------

// Rappel de ce que veut dire chaque état d'un membre, affiché au-dessus du
// tableau. Les mêmes phrases servent d'infobulle sur les pastilles d'état
// (StatusBadge) et d'aide sous le choix de l'état dans le formulaire.
export function StatusLegend() {
  const { t } = useTranslation();

  return (
    <div className="mt-4 rounded-xl bg-gray-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
        <InformationCircleIcon aria-hidden="true" className="size-4" />
        {t("admin.membres.statusHelp.title")}
      </p>
      <dl className="mt-3 grid gap-4 md:grid-cols-3">
        {["attente", "actif", "desactive"].map((key) => (
          <div key={key}>
            <dt>
              <StatusBadge status={key} />
            </dt>
            <dd className="mt-1.5 text-xs leading-relaxed text-gray-500">
              {t(`admin.membres.statusHelp.${key}`)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
