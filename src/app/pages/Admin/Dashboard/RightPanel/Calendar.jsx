// Import Dependencies
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

// Calendrier compact : bande de 5 jours autour de la date sélectionnée,
// flèches pour avancer/reculer jour par jour, et un bouton mois qui ouvre
// un sélecteur mois / année / jour (Popover Headless UI).
export function Calendar() {
  const { t } = useTranslation();
  const dayLabels = t("admin.common.days", { returnObjects: true });
  const monthsShort = t("admin.common.monthsShort", { returnObjects: true });
  const monthsFull = t("admin.common.monthsFull", { returnObjects: true });

  const [selected, setSelected] = useState(() => dayjs());

  const days = useMemo(
    () => Array.from({ length: 5 }, (_, i) => selected.subtract(2 - i, "day")),
    [selected],
  );

  const years = useMemo(() => {
    const y = selected.year();
    return Array.from({ length: 6 }, (_, i) => y - 2 + i);
  }, [selected]);

  const daysInMonth = selected.daysInMonth();

  const shift = (amount) => setSelected((d) => d.add(amount, "day"));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-bold text-gray-900">{t("admin.dashboard.calendar.title")}</h2>
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={t("admin.dashboard.calendar.prevDay")}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={t("admin.dashboard.calendar.nextDay")}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
          >
            <ChevronRightIcon aria-hidden="true" className="size-3.5" />
          </button>
        </div>

        <Popover className="relative">
          <PopoverButton className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-black/5">
            <CalendarDaysIcon aria-hidden="true" className="size-3.5 text-[#52A2DF]" />
            {monthsShort[selected.month()]}
          </PopoverButton>
          <PopoverPanel
            anchor={{ to: "bottom end", gap: 8 }}
            className="z-20 w-56 rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/5"
          >
            {({ close }) => (
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-gray-600">
                  {t("admin.dashboard.calendar.month")}
                  <select
                    value={selected.month()}
                    onChange={(event) =>
                      setSelected((d) => d.month(Number(event.target.value)))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#52A2DF]"
                  >
                    {monthsFull.map((label, index) => (
                      <option key={label} value={index}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-gray-600">
                  {t("admin.dashboard.calendar.year")}
                  <select
                    value={selected.year()}
                    onChange={(event) =>
                      setSelected((d) => d.year(Number(event.target.value)))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#52A2DF]"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-gray-600">
                  {t("admin.dashboard.calendar.day")}
                  <select
                    value={selected.date()}
                    onChange={(event) => {
                      setSelected((d) => d.date(Number(event.target.value)));
                      close();
                    }}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#52A2DF]"
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </PopoverPanel>
        </Popover>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {days.map((day) => {
          const isSelected = day.isSame(selected, "day");
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelected(day)}
              className={clsx(
                "flex flex-col items-center rounded-xl px-1.5 py-2.5 text-center transition-colors",
                isSelected
                  ? "bg-[#52A2DF] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-[#52A2DF]/[0.1]",
              )}
            >
              <span className="text-[10px] font-medium uppercase opacity-80">
                {dayLabels[day.day()]}
              </span>
              <span className="text-sm font-bold">{day.format("DD")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
