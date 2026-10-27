// Import Dependencies
import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { useMembersStore, listMembers } from "../Membres/membersStore";
import { useTontineFormat } from "./format";
import { GROUP_SIZE, PER_TOUR, TOTAL_TOURS, nextGroupLetter } from "./mockData";
import { buildPlanningPlan, decodeText, readPlanningRows, templateRows } from "./planningImport";
import { downloadCsv } from "./registreUtils";

// ----------------------------------------------------------------------

const MAX_BYTES = 1024 * 1024;

const SELECT =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-[#EE7115] focus:ring-2 focus:ring-[#EE7115]/20";

// Import d'un planning de bénéficiaires : l'administration charge un fichier
// CSV (qui reçoit la cagnotte, et quel mois), voit ligne par ligne ce qui sera
// retenu et ce qui sera laissé de côté, puis valide. Le planning devient soit un
// nouveau groupe, soit les mois remplis d'un groupe déjà ouvert. Seuls les
// membres qui attendent encore un groupe peuvent être placés : on les retrouve
// par leur matricule, ou à défaut par leur nom. Rien n'est enregistré avant la
// validation. Le composant est monté à chaque ouverture : il repart d'un
// formulaire vide.
export function ImportPlanningModal({ waitingByLevel, groups, initialLevelKey, onClose, onImport }) {
  const { t, month } = useTontineFormat();
  const snapshot = useMembersStore();
  const inputRef = useRef(null);

  const levelOptions = levels.filter((level) => waitingByLevel.some((entry) => entry.levelKey === level.key));
  const [levelKey, setLevelKey] = useState(
    levelOptions.some((level) => level.key === initialLevelKey) ? initialLevelKey : (levelOptions[0]?.key ?? ""),
  );
  // "new" : un nouveau groupe ; sinon l'identifiant d'un groupe ouvert.
  const [destination, setDestination] = useState("new");
  const [file, setFile] = useState(null);
  const [problem, setProblem] = useState("");
  const [dragging, setDragging] = useState(false);

  const monthLabel = (value) => month(dayjs(`${value}-01`));

  const everyone = useMemo(() => listMembers(snapshot), [snapshot]);
  const candidates = useMemo(() => {
    const matricules = new Map(everyone.map((member) => [member.id, member.matricule]));
    const entry = waitingByLevel.find((item) => item.levelKey === levelKey);
    return (entry?.members ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      city: member.city,
      matricule: matricules.get(member.id) ?? "",
    }));
  }, [everyone, waitingByLevel, levelKey]);
  const others = useMemo(() => {
    const ids = new Set(candidates.map((member) => member.id));
    return everyone.filter((member) => !ids.has(member.id)).map((member) => ({ name: member.name, matricule: member.matricule }));
  }, [everyone, candidates]);

  const openGroups = groups.filter((group) => group.levelKey === levelKey && group.capacity && group.freeSlots.length > 0);
  const targetGroup = openGroups.find((group) => group.id === destination) ?? null;
  const letter = nextGroupLetter(groups, levelKey);

  const plan = useMemo(() => {
    if (!file) return null;
    const target = targetGroup
      ? {
          mode: "group",
          free: Object.fromEntries(targetGroup.freeSlots.map((slot) => [slot.month.format("YYYY-MM"), slot.openSlots])),
        }
      : { mode: "new", perTour: PER_TOUR, groupSize: GROUP_SIZE, totalTours: TOTAL_TOURS };
    return buildPlanningPlan({ rows: file.rows, candidates, others, target });
  }, [file, candidates, others, targetGroup]);

  const changeLevel = (key) => {
    setLevelKey(key);
    setDestination("new");
  };

  const readFile = async (selected) => {
    setProblem("");
    if (!selected) return;
    if (/\.xlsx?$/i.test(selected.name)) {
      setFile(null);
      setProblem("excel");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFile(null);
      setProblem("tooBig");
      return;
    }
    try {
      const rows = readPlanningRows(decodeText(await selected.arrayBuffer()));
      if (rows.length === 0) {
        setFile(null);
        setProblem("empty");
        return;
      }
      setFile({ name: selected.name, rows });
    } catch {
      setFile(null);
      setProblem("unreadable");
    }
  };

  const onPick = (event) => {
    readFile(event.target.files?.[0]);
    // Permet de re-choisir le même fichier après l'avoir corrigé.
    event.target.value = "";
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    readFile(event.dataTransfer.files?.[0]);
  };

  const downloadTemplate = () =>
    downloadCsv(`modele-planning-${levelKey}.csv`, templateRows({
      candidates,
      startMonth: dayjs().startOf("month").add(1, "month").format("YYYY-MM"),
      perTour: PER_TOUR,
      header: [t("admin.tontine.import.columns.matricule"), t("admin.tontine.import.columns.name"), t("admin.tontine.import.columns.month")],
    }));

  const submit = () => {
    if (!plan || plan.readyCount === 0) return;
    if (targetGroup) {
      onImport({ mode: "group", groupId: targetGroup.id, members: plan.accepted });
      return;
    }
    onImport({
      mode: "new",
      record: {
        id: `${levelKey}-${letter}`,
        levelKey,
        letter,
        startMonth: `${plan.startMonth}-01`,
        capacity: GROUP_SIZE,
        perTour: PER_TOUR,
        members: plan.accepted,
      },
    });
  };

  const reasonText = (item) =>
    t(`admin.tontine.import.reasons.${item.reason}`, {
      perTour: PER_TOUR,
      size: GROUP_SIZE,
      months: TOTAL_TOURS,
      month: item.params.month ? monthLabel(item.params.month) : "",
      start: item.params.start ? monthLabel(item.params.start) : "",
    });

  // Les lignes à corriger d'abord : ce sont elles qui demandent un geste.
  const sortedItems = plan ? [...plan.items.filter((item) => item.reason), ...plan.items.filter((item) => !item.reason)] : [];
  const startsInPast = plan?.startMonth && !targetGroup && plan.startMonth < dayjs().format("YYYY-MM");

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">{t("admin.tontine.import.title")}</DialogTitle>
              <p className="mt-1 text-sm text-gray-500">{t("admin.tontine.import.subtitle")}</p>
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
                  {t("admin.tontine.import.destination")}
                  <select value={destination} onChange={(event) => setDestination(event.target.value)} className={SELECT}>
                    <option value="new">{t("admin.tontine.import.newGroup", { letter })}</option>
                    {openGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {t("admin.tontine.import.existingGroup", {
                          letter: group.letter,
                          count: group.freeSlots.reduce((sum, slot) => sum + slot.openSlots, 0),
                        })}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    {t("admin.tontine.import.fileLabel")}
                  </h3>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    disabled={candidates.length === 0}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EE7115] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <DocumentArrowDownIcon aria-hidden="true" className="size-4" />
                    {t("admin.tontine.import.template")}
                  </button>
                </div>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={clsx(
                    "mt-2 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                    dragging ? "border-[#EE7115] bg-[#EE7115]/[0.05]" : "border-gray-200 bg-gray-50/60",
                  )}
                >
                  <ArrowUpTrayIcon aria-hidden="true" className="size-6 text-gray-400" />
                  {file ? (
                    <p className="max-w-full truncate text-sm font-semibold text-gray-900">{file.name}</p>
                  ) : (
                    <p className="text-sm font-medium text-gray-600">{t("admin.tontine.import.drop")}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-gray-50"
                  >
                    {file ? t("admin.tontine.import.change") : t("admin.tontine.import.choose")}
                  </button>
                  <input ref={inputRef} type="file" accept=".csv,.txt,text/csv" onChange={onPick} className="hidden" />
                </div>
                <p className="mt-2 text-xs text-gray-500">{t("admin.tontine.import.format", { perTour: PER_TOUR })}</p>

                {problem && (
                  <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {t(`admin.tontine.import.problems.${problem}`)}
                  </p>
                )}
              </div>

              {plan && (
                <section aria-labelledby="import-preview" className="mt-5">
                  <h3 id="import-preview" className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    {t("admin.tontine.import.preview")}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                      {t("admin.tontine.import.read", { count: plan.items.length })}
                    </span>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                      {t("admin.tontine.import.ready", { count: plan.readyCount })}
                    </span>
                    {plan.problemCount > 0 && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-red-600">
                        {t("admin.tontine.import.toFix", { count: plan.problemCount })}
                      </span>
                    )}
                  </div>

                  <ul className="mt-3 max-h-80 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
                    {sortedItems.map((item) => (
                      <li key={item.line} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
                        <span className="w-9 shrink-0 text-[11px] font-semibold text-gray-400">
                          {t("admin.tontine.import.line", { n: item.line })}
                        </span>
                        <span className="min-w-0 flex-1 basis-40">
                          <span className="block truncate text-sm font-semibold text-gray-900">
                            {item.member?.name || item.name || item.matricule}
                          </span>
                          {(item.member?.matricule || item.matricule) && (
                            <span className="block truncate text-xs text-gray-400">
                              {item.member?.matricule || item.matricule}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                          {item.monthValue ? monthLabel(item.monthValue) : item.month || "—"}
                        </span>
                        {item.reason ? (
                          <span className="flex w-full items-start gap-1.5 text-xs font-medium text-red-600 sm:w-64">
                            <ExclamationCircleIcon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                            {reasonText(item)}
                          </span>
                        ) : (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-green-700 sm:w-64">
                            <CheckCircleIcon aria-hidden="true" className="size-3.5" />
                            {t("admin.tontine.import.accepted")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {plan.startMonth && !targetGroup && (
                    <p className="mt-3 rounded-xl bg-[#52A2DF]/[0.07] px-3 py-2 text-xs font-medium text-gray-700">
                      {t("admin.tontine.import.startsIn", { month: monthLabel(plan.startMonth) })}
                      {startsInPast && ` ${t("admin.tontine.import.pastNote")}`}
                    </p>
                  )}
                </section>
              )}
            </>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
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
              disabled={!plan || plan.readyCount === 0}
              className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t(targetGroup ? "admin.tontine.import.submitGroup" : "admin.tontine.import.submitNew", {
                count: plan?.readyCount ?? 0,
                letter,
              })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
