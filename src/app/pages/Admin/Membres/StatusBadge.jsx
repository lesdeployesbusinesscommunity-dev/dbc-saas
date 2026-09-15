// Import Dependencies
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { statusOptions } from "./mockData";

// ----------------------------------------------------------------------

const STYLES = {
  attente: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  actif: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  desactive: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/20",
};

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  const labelKey = statusOptions.find((option) => option.value === status)?.labelKey;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[status] ?? STYLES.attente,
      )}
    >
      {labelKey ? t(labelKey) : status}
    </span>
  );
}
