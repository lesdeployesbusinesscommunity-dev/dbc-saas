// Import Dependencies
import { useState } from "react";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Avatar } from "../components/Avatar";
import { useTontineFormat } from "./format";

// ----------------------------------------------------------------------

const VISIBLE_BY_DEFAULT = 5;

// Les membres qui n'ont pas cotisé alors que le jour de cotisation est
// passé, du plus en retard au moins en retard. L'admin ne valide rien ici : un
// membre sort de cette liste tout seul dès que son paiement est arrivé.
export function LateContributions({ entries, onOpenGroup }) {
  const { t, money } = useTontineFormat();
  const [expanded, setExpanded] = useState(false);

  const sorted = [...entries].sort(
    (a, b) => b.member.daysLate - a.member.daysLate || a.member.name.localeCompare(b.member.name),
  );
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_BY_DEFAULT);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <ExclamationTriangleIcon aria-hidden="true" className="size-4 text-red-600" />
          {t("admin.tontine.late.title")}
        </h2>
        {sorted.length > 0 && (
          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">{sorted.length}</span>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-500">{t("admin.tontine.late.hint")}</p>

      {sorted.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircleIcon aria-hidden="true" className="size-8 text-green-600" />
          <p className="text-sm text-gray-500">{t("admin.tontine.late.empty")}</p>
        </div>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-gray-100">
            {visible.map(({ group, member }) => (
              <li key={`${group.id}-${member.id}`} className="flex items-center gap-3 py-3">
                <Avatar name={member.name} size="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {t(`simulateur.levels.${group.levelKey}.name`)} ·{" "}
                    <button
                      type="button"
                      onClick={() => onOpenGroup(group.id)}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {t("admin.tontine.group", { letter: group.letter })}
                    </button>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {t("admin.tontine.late.days", { count: member.daysLate })} · {money(group.cotisation)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {sorted.length > VISIBLE_BY_DEFAULT && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 text-xs font-semibold text-[#EE7115] hover:underline"
            >
              {expanded
                ? t("admin.tontine.late.showLess")
                : t("admin.tontine.late.showAll", { count: sorted.length })}
            </button>
          )}
        </>
      )}
    </section>
  );
}
