// Import Dependencies
import dayjs from "dayjs";
import clsx from "clsx";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ArrowDownTrayIcon, CalendarDaysIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

// Local Imports
import { LevelBadge } from "./LevelBadge";
import { useTontineFormat } from "./format";
import { shortName } from "./mockData";
import { exportPlanning } from "./planningExport";

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
// chaque case les 3 bénéficiaires du groupe ce mois-là. Comme les groupes ont
// démarré à des dates différentes, on lit d'un coup d'œil qui reçoit en même
// temps dans quels groupes. Une case vide veut dire que le groupe n'a pas de
// tour ce mois-là (pas encore démarré, ou cycle terminé).
export function YearPlanning({ groups, onOpenGroup }) {
  const { t, monthShort } = useTontineFormat();
  const firstMonth = dayjs().startOf("month").subtract(MONTHS_BEFORE, "month");
  const columns = Array.from({ length: MONTHS_SHOWN }, (_, i) => firstMonth.add(i, "month"));

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <CalendarDaysIcon aria-hidden="true" className="size-4 text-gray-400" />
            {t("admin.tontine.planning.title")}
          </h2>
          <p className="mt-1 text-xs text-gray-500">{t("admin.tontine.planning.hint")}</p>
        </div>
        <ExportMenu groups={groups} />
      </div>

      {groups.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-gray-500">{t("admin.tontine.noGroups")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
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
                      <td key={month.format("YYYY-MM")} className="px-1 py-1.5 align-top">
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
                            title={`${entry.memberNames} — ${t("admin.tontine.tourOf", { tour: entry.tour, total: group.totalTours })}`}
                            className={clsx(
                              "block w-full space-y-0.5 rounded-md px-1.5 py-1.5 text-center text-[11px] font-semibold outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#EE7115]/40",
                              CELL_STYLES[entry.status],
                            )}
                          >
                            {entry.members.map((member) => (
                              <span key={member.id} className="block truncate">
                                {shortName(member.name)}
                              </span>
                            ))}
                            {entry.openSlots > 0 && (
                              <span className="block truncate font-medium opacity-70">
                                {t("admin.tontine.openSlots", { count: entry.openSlots })}
                              </span>
                            )}
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

// Bouton "Exporter" : deux présentations du planning en CSV, sur les groupes
// affichés (niveau et recherche déjà appliqués). Sans groupe, rien à exporter.
function ExportMenu({ groups }) {
  const { t, month } = useTontineFormat();
  const empty = groups.length === 0;

  return (
    <Menu as="div" className="shrink-0">
      <MenuButton
        disabled={empty}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowDownTrayIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
        {t("admin.tontine.export.open")}
        <ChevronDownIcon aria-hidden="true" className="size-4 text-gray-400" />
      </MenuButton>
      <MenuItems
        anchor={{ to: "bottom end", gap: 6 }}
        className="z-30 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white py-1 text-left shadow-lg ring-1 ring-black/5 focus:outline-none"
      >
        <p className="px-4 pb-1 pt-2 text-[11px] font-semibold text-gray-400">
          {t("admin.tontine.export.scope", { count: groups.length })}
        </p>
        {["list", "grid"].map((kind) => (
          <MenuItem key={kind}>
            <button
              type="button"
              onClick={() => exportPlanning(kind, { groups, t, month })}
              className="block w-full px-4 py-2.5 text-left data-[focus]:bg-gray-50"
            >
              <span className="block text-sm font-semibold text-gray-900">{t(`admin.tontine.export.${kind}`)}</span>
              <span className="mt-0.5 block text-xs text-gray-500">{t(`admin.tontine.export.${kind}Hint`)}</span>
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
