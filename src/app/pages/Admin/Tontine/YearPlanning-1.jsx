// Import Dependencies
import dayjs from "dayjs";
import clsx from "clsx";
import { CalendarDaysIcon } from "@heroicons/react/24/solid";

// Local Imports
import { LevelBadge } from "./LevelBadge";
import { useTontineFormat } from "./format";
import { shortName } from "./mockData";

// ----------------------------------------------------------------------

// Nombre de mois affichés avant le mois en cours : on garde un peu de recul
// pour voir qui vient de recevoir, et le reste de la fenêtre montre ce qui
// vient.
const MONTHS_BEFORE = 2;
const MONTHS_SHOWN = 12;

const CELL_STYLES = {
  closed: "bg-gray-50 text-gray-500",
  current: "bg-[#EE7115] font-bold text-white shadow-sm",
  upcoming: "bg-[#52A2DF]/[0.08] text-[#2f7fbd]",
};

// "Qui bouffe quand" : une ligne par groupe, une colonne par mois, et dans
// chaque case le bénéficiaire du groupe ce mois-là. Comme les groupes ont
// démarré à des dates différentes, on lit d'un coup d'œil qui reçoit en même
// temps dans quels groupes. Une case vide veut dire que le groupe n'a pas de
// tour ce mois-là (pas encore démarré, ou cycle terminé).
export function YearPlanning({ groups, onOpenGroup }) {
  const { t, monthShort } = useTontineFormat();
  const firstMonth = dayjs().startOf("month").subtract(MONTHS_BEFORE, "month");
  const columns = Array.from({ length: MONTHS_SHOWN }, (_, i) => firstMonth.add(i, "month"));

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <CalendarDaysIcon aria-hidden="true" className="size-4 text-[#52A2DF]" />
        {t("admin.tontine.planning.title")}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t("admin.tontine.planning.hint")}</p>

      {groups.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-gray-500">{t("admin.tontine.noGroups")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th scope="col" className="sticky left-0 z-10 w-44 bg-gray-50 px-3 py-3">
                  {t("admin.tontine.planning.group")}
                </th>
                {columns.map((month) => {
                  const isCurrent = month.isSame(dayjs(), "month");
                  return (
                    <th
                      key={month.format("YYYY-MM")}
                      scope="col"
                      className={clsx("px-1.5 py-3 text-center", isCurrent && "text-[#EE7115]")}
                    >
                      {monthShort(month)}
                      <span className="block text-[10px] font-medium normal-case text-gray-400">{month.year()}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-t border-gray-100">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-normal">
                    <button
                      type="button"
                      onClick={() => onOpenGroup(group.id)}
                      className="flex flex-col items-start gap-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-[#EE7115]/40"
                    >
                      <LevelBadge levelKey={group.levelKey} />
                      <span className="text-xs font-bold text-gray-800">
                        {t("admin.tontine.group", { letter: group.letter })}
                      </span>
                    </button>
                  </th>
                  {columns.map((month) => {
                    const entry = group.schedule.find((slot) => slot.month.isSame(month, "month"));
                    return (
                      <td key={month.format("YYYY-MM")} className="px-1 py-1.5">
                        {entry?.free ? (
                          <button
                            type="button"
                            onClick={() => onOpenGroup(group.id)}
                            title={t("admin.tontine.freeSlotTitle", { tour: entry.tour, total: group.totalTours })}
                            className="block w-full truncate rounded-md border border-dashed border-violet-300 px-1.5 py-2 text-center text-[11px] font-semibold text-violet-600 outline-none hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-[#EE7115]/40"
                          >
                            {t("admin.tontine.free")}
                          </button>
                        ) : entry ? (
                          <button
                            type="button"
                            onClick={() => onOpenGroup(group.id)}
                            title={`${entry.memberName} — ${t("admin.tontine.tourOf", { tour: entry.tour, total: group.totalTours })}`}
                            className={clsx(
                              "block w-full truncate rounded-md px-1.5 py-2 text-center text-[11px] font-semibold outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#EE7115]/40",
                              CELL_STYLES[entry.status],
                            )}
                          >
                            {shortName(entry.memberName)}
                          </button>
                        ) : (
                          <span aria-hidden="true" className="block py-2 text-center text-gray-200">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
