// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import dayjs from "dayjs";

// Local Imports
import { Avatar } from "../components/Avatar";
import { assignmentPlace, fullName, listLeaders } from "./registrationUtils";

// ----------------------------------------------------------------------

const leaderKey = (leader) => `${leader.country}:${leader.nodeId}`;

// Choix du leader qui mènera l'entretien. On propose d'abord les leaders du
// MÊME PAYS que le candidat (ceux qui sont en poste dans le réseau, voir
// Gestion du réseau) ; une case permet d'élargir aux leaders des autres pays
// (utile quand le pays du candidat n'a encore aucun réseau). La date de
// l'entretien et un mot pour le leader sont facultatifs.
export function AssignLeaderModal({ registration, networksByCountry, onClose, onConfirm }) {
  const { t } = useTranslation();
  const open = Boolean(registration);

  const localLeaders = useMemo(
    () => (registration ? listLeaders(networksByCountry, registration.pays) : []),
    [networksByCountry, registration],
  );
  const allLeaders = useMemo(() => listLeaders(networksByCountry), [networksByCountry]);

  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!registration) return;
    const current = registration.assignment;
    setShowAll(localLeaders.length === 0);
    setSelected(
      current
        ? (allLeaders.find(
            (leader) => leader.leaderId === current.leaderId && leader.nodeId === current.nodeId,
          ) ?? null)
        : null,
    );
    setInterviewDate(current?.interviewDate ?? "");
    setNote(current?.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration]);

  const leaders = showAll ? allLeaders : localLeaders;
  const selectedKey = selected ? leaderKey(selected) : null;

  const submit = (event) => {
    event.preventDefault();
    if (!selected) return;
    onConfirm({ leader: selected, interviewDate, note });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-base font-bold text-gray-900">
                {t("admin.inscriptions.assign.title")}
              </DialogTitle>
              {registration && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {t("admin.inscriptions.assign.subtitle", {
                    name: fullName(registration),
                    country: registration.pays,
                  })}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.membres.modal.close")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500">
                {showAll
                  ? t("admin.inscriptions.assign.allLeaders")
                  : t("admin.inscriptions.assign.leadersOf", { country: registration?.pays ?? "" })}
              </p>

              {leaders.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">
                  {t("admin.inscriptions.assign.noLeader")}
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5" role="radiogroup" aria-label={t("admin.inscriptions.assign.title")}>
                  {leaders.map((leader) => {
                    const checked = selectedKey === leaderKey(leader);
                    return (
                      <li key={leaderKey(leader)}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          onClick={() => setSelected(leader)}
                          className={clsx(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            checked ? "bg-[#52A2DF]/[0.12] ring-1 ring-[#52A2DF]" : "hover:bg-gray-50",
                          )}
                        >
                          <Avatar name={leader.leaderName} src={leader.photo} size="size-10" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-gray-900">
                              {leader.leaderName}
                            </span>
                            <span className="flex items-center gap-1 truncate text-xs text-gray-500">
                              <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
                              {assignmentPlace(leader, t)}
                              {showAll && ` · ${leader.country}`}
                            </span>
                          </span>
                          {leader.isNational && (
                            <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#EE7115]">
                              {t("admin.reseau.levels.national")}
                            </span>
                          )}
                          {checked && <CheckIcon aria-hidden="true" className="size-5 shrink-0 text-[#52A2DF]" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {localLeaders.length > 0 && (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(event) => setShowAll(event.target.checked)}
                    className="accent-[#EE7115]"
                  />
                  {t("admin.inscriptions.assign.showAll")}
                </label>
              )}

              <div className="mt-4 grid grid-cols-1 gap-4">
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.inscriptions.assign.date")}
                  <input
                    type="date"
                    min={dayjs().format("YYYY-MM-DD")}
                    value={interviewDate}
                    onChange={(event) => setInterviewDate(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-[#52A2DF]"
                  />
                </label>
                <label className="block text-xs font-semibold text-gray-500">
                  {t("admin.inscriptions.assign.note")}
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={t("admin.inscriptions.assign.notePlaceholder")}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-800 outline-none focus:border-[#52A2DF]"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("admin.membres.modal.cancel")}
              </button>
              <button
                type="submit"
                disabled={!selected}
                className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("admin.inscriptions.assign.confirm")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
