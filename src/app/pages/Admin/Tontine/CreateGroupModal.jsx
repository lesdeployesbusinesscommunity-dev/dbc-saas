// Import Dependencies
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { Avatar } from "../components/Avatar";
import { monthsFrom } from "../components/monthUtils";
import { useTontineFormat } from "./format";
import { GROUP_SIZE, PER_TOUR, TOTAL_TOURS, nextGroupLetter } from "./mockData";

// ----------------------------------------------------------------------

const START_CHOICES = [1, 2, 3];

// Création d'un groupe : l'administration choisit un niveau et le mois du
// premier tour. Un groupe réunit 36 personnes sur 12 mois, donc 3 personnes
// reçoivent la cagnotte chaque mois. Elle place ensuite les membres qui
// attendent, chacun sur le mois où il reçoit la cagnotte (3 par mois au plus).
// Un groupe peut démarrer avec seulement quelques membres : les places
// restantes restent libres pour les prochains arrivants (voir la fiche du
// groupe). Un groupe ne peut démarrer qu'à partir du mois prochain : les
// cotisations du mois en cours sont déjà en cours de paiement. Le composant
// est monté à chaque ouverture, donc il repart toujours d'un formulaire vide.
export function CreateGroupModal({ waitingByLevel, groups, initialLevelKey, onClose, onCreate }) {
  const { t, money, month } = useTontineFormat();

  const levelOptions = levels.filter((level) => waitingByLevel.some((entry) => entry.levelKey === level.key));
  const [levelKey, setLevelKey] = useState(
    waitingByLevel.some((entry) => entry.levelKey === initialLevelKey) ? initialLevelKey : (levelOptions[0]?.key ?? ""),
  );
  // Les membres cochés, dans l'ordre où l'on a cliqué, et le mois choisi pour chacun.
  const [selected, setSelected] = useState([]);
  const [monthOf, setMonthOf] = useState({});
  const [monthsAhead, setMonthsAhead] = useState(1);

  const capacity = GROUP_SIZE;

  const level = levels.find((l) => l.key === levelKey);
  const entry = waitingByLevel.find((e) => e.levelKey === levelKey);
  const waiting = [...(entry?.members ?? [])].sort((a, b) => b.waitingDays - a.waitingDays);
  const startMonth = dayjs().startOf("month").add(monthsAhead, "month");
  const slots = useMemo(
    () => monthsFrom(startMonth.format("YYYY-MM"), TOTAL_TOURS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthsAhead],
  );

  // Trois membres au plus par mois : on garde le choix de l'administration
  // s'il est valable (le mois n'est pas déjà complet), sinon le premier mois
  // qui a encore de la place.
  const placed = useMemo(() => {
    const used = new Map();
    const hasRoom = (slot) => (used.get(slot) ?? 0) < PER_TOUR;
    const result = [];
    selected.slice(0, GROUP_SIZE).forEach((id) => {
      const wanted = monthOf[id];
      const chosen = slots.includes(wanted) && hasRoom(wanted) ? wanted : slots.find(hasRoom);
      if (!chosen) return;
      used.set(chosen, (used.get(chosen) ?? 0) + 1);
      result.push({ id, month: chosen });
    });
    return result;
  }, [selected, monthOf, slots]);

  const ordered = placed
    .map(({ id, month: m }) => ({ ...waiting.find((member) => member.id === id), month: m }))
    .filter((member) => member.name);
  const isFull = ordered.length >= GROUP_SIZE;
  const canSubmit = ordered.length >= 1;
  const monthLabel = (value) => month(dayjs(`${value}-01`));

  const changeLevel = (key) => {
    setLevelKey(key);
    setSelected([]);
    setMonthOf({});
  };

  const toggle = (id) =>
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      return current.length >= GROUP_SIZE ? current : [...current, id];
    });

  const chooseMonth = (id, value) => setMonthOf((current) => ({ ...current, [id]: value }));

  const submit = () => {
    if (!canSubmit) return;
    onCreate({
      id: `${levelKey}-${nextGroupLetter(groups, levelKey)}`,
      levelKey,
      letter: nextGroupLetter(groups, levelKey),
      startMonth: startMonth.format("YYYY-MM-DD"),
      capacity,
      perTour: PER_TOUR,
      members: ordered.map(({ id, name, city, month: m }) => ({ id, name, city, month: m })),
    });
  };

  const SELECT =
    "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-[#EE7115] focus:ring-2 focus:ring-[#EE7115]/20";

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">{t("admin.tontine.create.title")}</DialogTitle>
              <p className="mt-1 text-sm text-gray-500">{t("admin.tontine.create.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.tontine.detail.close")}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          {levelOptions.length === 0 ? (
            <p className="mt-8 py-6 text-center text-sm text-gray-500">{t("admin.tontine.create.noWaiting")}</p>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {t("admin.tontine.create.level")}
                  <select value={levelKey} onChange={(event) => changeLevel(event.target.value)} className={SELECT}>
                    {levelOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {t(`simulateur.levels.${option.key}.name`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-gray-700">
                  {t("admin.tontine.create.start")}
                  <select
                    value={monthsAhead}
                    onChange={(event) => setMonthsAhead(Number(event.target.value))}
                    className={SELECT}
                  >
                    {START_CHOICES.map((n) => (
                      <option key={n} value={n}>
                        {month(dayjs().startOf("month").add(n, "month"))}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {t("admin.tontine.create.sizeHint", { size: GROUP_SIZE, months: TOTAL_TOURS, perTour: PER_TOUR })}
              </p>

              <div className="mt-4 rounded-xl bg-[#52A2DF]/[0.07] p-4 text-sm text-gray-700">
                {t("admin.tontine.create.summary", {
                  cotisation: money(level?.cotisation ?? 0),
                  pot: money(level?.cagnotte ?? 0),
                })}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section aria-labelledby="create-waiting">
                  <div className="flex items-center justify-between gap-2">
                    <h3 id="create-waiting" className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      {t("admin.tontine.create.waiting")}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelected(waiting.slice(0, GROUP_SIZE).map((member) => member.id))}
                      className="text-xs font-semibold text-[#EE7115] hover:underline"
                    >
                      {t("admin.tontine.create.pickAll")}
                    </button>
                  </div>
                  <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {waiting.map((member) => {
                      const checked = selected.includes(member.id);
                      const disabled = !checked && isFull;
                      return (
                        <li key={member.id}>
                          <label
                            className={clsx(
                              "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2",
                              checked ? "border-[#EE7115] bg-[#EE7115]/[0.05]" : "border-gray-100",
                              disabled && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggle(member.id)}
                              className="size-4 rounded border-gray-300 text-[#EE7115] focus:ring-[#EE7115]"
                            />
                            <Avatar name={member.name} size="size-8" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-gray-900">{member.name}</span>
                              <span className="block truncate text-xs text-gray-400">
                                {member.city} · {t("admin.tontine.waiting.since", { count: member.waitingDays })}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section aria-labelledby="create-order">
                  <h3 id="create-order" className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    {t("admin.tontine.create.order")} · {t("admin.tontine.create.selected", { count: ordered.length, size: capacity })}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{t("admin.tontine.create.orderHint")}</p>
                  {ordered.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                      {t("admin.tontine.create.orderEmpty")}
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {ordered.map((member) => (
                        <li key={member.id} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{member.name}</span>
                          <select
                            aria-label={t("admin.tontine.create.monthFor", { name: member.name })}
                            value={member.month}
                            onChange={(event) => chooseMonth(member.id, event.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#52A2DF]"
                          >
                            {slots
                              .filter(
                                (slot) =>
                                  slot === member.month ||
                                  ordered.filter((other) => other.month === slot).length < PER_TOUR,
                              )
                              .map((slot) => (
                                <option key={slot} value={slot}>
                                  {monthLabel(slot)}
                                </option>
                              ))}
                          </select>
                        </li>
                      ))}
                    </ul>
                  )}
                  {ordered.length > 0 && ordered.length < capacity && (
                    <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700">
                      {t("admin.tontine.create.openPlaces", { count: capacity - ordered.length })}
                    </p>
                  )}
                </section>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t("admin.tontine.create.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("admin.tontine.create.submit")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
