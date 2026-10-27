// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { Avatar } from "../components/Avatar";
import { MonthPicker } from "../components/MonthPicker";
import { currentMonthValue, isMonthValue, monthsFrom, useMonthLabels } from "../components/monthUtils";
import { listMembers, useMembersStore } from "../Membres/membersStore";
import { levelNumbers } from "../Membres/mockData";
import { useMembersFormat } from "../Membres/useMembersFormat";
import { DEFAULT_CAPACITY, MAX_CAPACITY, MIN_CAPACITY } from "./mockData";

// ----------------------------------------------------------------------

const INPUT =
  "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#52A2DF]";

// "Lancer une demande de choix" : l'administration choisit le niveau, le mois
// de début du futur groupe, son nombre de places (c'est elle qui le fixe) et
// les membres à placer — il n'est pas nécessaire que le groupe soit plein.
// Elle peut aussi viser les mois encore libres d'un groupe déjà ouvert, pour
// y placer les nouveaux arrivants sans qu'ils attendent. Chacun recevra la demande
// (message sur la plateforme) de choisir 3 mois dans la période, avec
// rappel par e-mail et WhatsApp à la main (voir CampaignDetailModal). Les
// membres proposés sont ceux du niveau choisi : ceux dont le "mois de début
// de la tontine" (fiche du membre) est le mois du groupe sont cochés
// d'office. Un membre déjà dans une demande en cours n'est pas proposé.
export function CampaignFormModal({ campaigns, groups = [], initialGroupId = "", onClose, onCreate }) {
  const { t } = useTranslation();
  const { monthYear } = useMonthLabels();
  const { fullDate } = useMembersFormat();
  const snapshot = useMembersStore();

  const initialGroup = groups.find((group) => group.id === initialGroupId);
  const [levelKey, setLevelKey] = useState(initialGroup?.levelKey ?? levels[0].key);
  // "" : un nouveau groupe ; sinon l'identifiant d'un groupe ouvert dont on remplit les mois libres.
  const [groupId, setGroupId] = useState(initialGroup ? initialGroup.id : "");
  const [capacityText, setCapacityText] = useState(String(DEFAULT_CAPACITY));
  const [startMonth, setStartMonth] = useState(dayjs().add(1, "month").format("YYYY-MM"));
  const [selected, setSelected] = useState([]);
  const [deadline, setDeadline] = useState(dayjs().add(10, "day").format("YYYY-MM-DD"));
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);
  const [message, setMessage] = useState("");
  const [messageEdited, setMessageEdited] = useState(false);

  const busy = useMemo(
    () =>
      new Set(
        campaigns
          .filter((campaign) => campaign.status !== "validated")
          .flatMap((campaign) => campaign.targets.map((target) => target.matricule)),
      ),
    [campaigns],
  );

  const candidates = useMemo(
    () =>
      listMembers(snapshot)
        .filter((member) => member.levelKey === levelKey && member.status !== "desactive")
        .sort(
          (a, b) =>
            Number(b.tontineStartMonth === startMonth) - Number(a.tontineStartMonth === startMonth) ||
            a.name.localeCompare(b.name),
        ),
    [snapshot, levelKey, startMonth],
  );

  // Coche d'office les membres de ce niveau qui démarrent ce mois-là (6 au
  // plus) chaque fois que le niveau ou le mois change.
  useEffect(() => {
    setSelected(
      candidates
        .filter((member) => !targetGroup && member.tontineStartMonth === startMonth && !busy.has(member.matricule))
        .slice(0, maxMembers)
        .map((member) => member.matricule),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelKey, startMonth, groupId, capacityText]);

  const openGroups = groups.filter(
    (group) => group.capacity && group.freeSlots.length > 0 && group.levelKey === levelKey,
  );
  const targetGroup = openGroups.find((group) => group.id === groupId) ?? null;
  const capacity = Number(capacityText);
  const capacityValid = Number.isInteger(capacity) && capacity >= MIN_CAPACITY && capacity <= MAX_CAPACITY;

  // La période proposée : les mois libres du groupe visé, ou "capacity" mois à
  // partir du mois de début d'un nouveau groupe.
  const monthValid = targetGroup ? true : isMonthValue(startMonth) && capacityValid;
  const period = targetGroup
    ? targetGroup.freeSlots.map((slot) => slot.month.format("YYYY-MM"))
    : monthValid
      ? monthsFrom(startMonth, capacity)
      : [];
  const maxMembers = period.length;
  const choices = Math.min(3, period.length);

  // Texte par défaut du message, tant que l'administrateur ne l'a pas modifié.
  useEffect(() => {
    if (messageEdited) return;
    setMessage(
      monthValid
        ? t(targetGroup ? "admin.tontine.choices.form.messageTemplateJoin" : "admin.tontine.choices.form.messageTemplate", {
            level: t(`simulateur.levels.${levelKey}.name`),
            start: monthYear(startMonth),
            from: monthYear(period[0]),
            to: monthYear(period[period.length - 1]),
            deadline: fullDate(deadline),
            count: choices,
          })
        : "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelKey, startMonth, groupId, capacityText, deadline, messageEdited, t]);

  const toggle = (matricule) =>
    setSelected((current) =>
      current.includes(matricule)
        ? current.filter((item) => item !== matricule)
        : current.length < maxMembers
          ? [...current, matricule]
          : current,
    );

  const canSubmit =
    monthValid && selected.length >= 1 && selected.length <= maxMembers && deadline !== "" && message.trim() !== "";

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onCreate({
      levelKey,
      startMonth: targetGroup ? period[0] : startMonth,
      capacity: targetGroup ? null : capacity,
      months: targetGroup ? period : undefined,
      groupId: targetGroup ? targetGroup.id : undefined,
      targets: candidates
        .filter((member) => selected.includes(member.matricule))
        .map((member) => ({
          id: member.id,
          matricule: member.matricule,
          name: member.name,
          city: member.city,
          email: member.email ?? "",
          whatsapp: member.whatsapp ?? "",
        })),
      deadline,
      message: message.trim(),
      channels: { email, whatsapp },
    });
  };

  return (
    <Dialog open onClose={onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-4 sm:items-center">
        <DialogPanel className="my-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#EE7115]">
                <ChatBubbleLeftRightIcon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900">
                  {t("admin.tontine.choices.form.title")}
                </DialogTitle>
                <p className="text-xs text-gray-500">{t("admin.tontine.choices.form.subtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.tontine.detail.close")}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.tontine.choices.form.level")}
                <select
                  value={levelKey}
                  onChange={(event) => {
                    setLevelKey(event.target.value);
                    setGroupId("");
                  }}
                  className={INPUT}
                >
                  {levels.map((level) => (
                    <option key={level.key} value={level.key}>
                      {t("admin.membres.levelWithName", {
                        n: levelNumbers[level.key],
                        name: t(`simulateur.levels.${level.key}.name`),
                      })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-500 sm:col-span-2">
                {t("admin.tontine.choices.form.for")}
                <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className={INPUT}>
                  <option value="">{t("admin.tontine.choices.form.newGroup")}</option>
                  {openGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {t("admin.tontine.choices.form.existingGroup", {
                        letter: group.letter,
                        count: group.freeSlots.length,
                      })}
                    </option>
                  ))}
                </select>
              </label>
              {!targetGroup && (
                <>
                  <div className="block text-xs font-semibold text-gray-500">
                    {t("admin.tontine.choices.form.startMonth")}
                    <MonthPicker required value={startMonth} onChange={setStartMonth} minValue={currentMonthValue()} />
                  </div>
                  <label className="block text-xs font-semibold text-gray-500">
                    {t("admin.tontine.choices.form.capacity")}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={MIN_CAPACITY}
                      max={MAX_CAPACITY}
                      value={capacityText}
                      onChange={(event) => setCapacityText(event.target.value)}
                      aria-invalid={!capacityValid}
                      className={clsx(INPUT, !capacityValid && "border-red-400")}
                    />
                    <span
                      className={clsx(
                        "mt-1 block text-[11px] font-normal",
                        capacityValid ? "text-gray-400" : "font-semibold text-red-600",
                      )}
                    >
                      {capacityValid
                        ? t("admin.tontine.choices.form.capacityHint")
                        : t("admin.tontine.create.capacityInvalid", { min: MIN_CAPACITY, max: MAX_CAPACITY })}
                    </span>
                  </label>
                </>
              )}
            </div>

            {monthValid && (
              <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-[#52A2DF]">
                {t("admin.tontine.choices.form.periodInfo", {
                  from: monthYear(period[0]),
                  to: monthYear(period[period.length - 1]),
                  count: choices,
                })}
              </p>
            )}

            <fieldset>
              <legend className="flex w-full items-baseline justify-between text-xs font-semibold text-gray-500">
                <span>{t("admin.tontine.choices.form.members")}</span>
                <span className={clsx(selected.length >= 1 ? "text-green-600" : "text-amber-600")}>
                  {t("admin.tontine.choices.form.selected", { count: selected.length, size: maxMembers })}
                </span>
              </legend>

              {candidates.length === 0 ? (
                <p className="mt-2 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  {t("admin.tontine.choices.form.noCandidates")}
                </p>
              ) : (
                <ul className="mt-2 max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
                  {candidates.map((member) => {
                    const taken = busy.has(member.matricule);
                    const checked = selected.includes(member.matricule);
                    const full = !checked && selected.length >= maxMembers;
                    const sameMonth = member.tontineStartMonth === startMonth;
                    return (
                      <li key={member.id}>
                        <label
                          className={clsx(
                            "flex items-center gap-3 px-3 py-2.5",
                            taken || full ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={taken || full}
                            onChange={() => toggle(member.matricule)}
                            className="size-4 rounded border-gray-300 accent-[#EE7115]"
                          />
                          <Avatar name={member.name} size="size-8" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-gray-900">{member.name}</span>
                            <span className="block text-xs text-gray-400">{member.matricule}</span>
                          </span>
                          <span className="shrink-0 text-right text-xs">
                            {taken ? (
                              <span className="text-gray-400">{t("admin.tontine.choices.form.alreadyInvited")}</span>
                            ) : member.tontineStartMonth ? (
                              <span className={sameMonth ? "font-semibold text-green-600" : "text-gray-400"}>
                                {t("admin.membres.table.tontineFrom", { month: monthYear(member.tontineStartMonth) })}
                              </span>
                            ) : (
                              <span className="text-amber-600">{t("admin.membres.table.tontineMissing")}</span>
                            )}
                            <span className="block text-[11px] text-gray-400">
                              {[
                                member.email ? t("admin.tontine.choices.form.hasEmail") : null,
                                member.whatsapp ? "WhatsApp" : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || t("admin.tontine.choices.form.noContact")}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-gray-500">
                {t("admin.tontine.choices.form.deadline")}
                <input
                  type="date"
                  required
                  min={dayjs().format("YYYY-MM-DD")}
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  className={INPUT}
                />
              </label>
              <fieldset>
                <legend className="text-xs font-semibold text-gray-500">{t("admin.tontine.choices.form.channels")}</legend>
                <div className="mt-1 space-y-1.5 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked disabled className="size-4 accent-[#EE7115]" />
                    {t("admin.tontine.choices.form.platform")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={email}
                      onChange={(event) => setEmail(event.target.checked)}
                      className="size-4 accent-[#EE7115]"
                    />
                    {t("admin.tontine.choices.form.emailReminder")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.checked)}
                      className="size-4 accent-[#EE7115]"
                    />
                    {t("admin.tontine.choices.form.whatsappReminder")}
                  </label>
                </div>
              </fieldset>
            </div>

            <label className="block text-xs font-semibold text-gray-500">
              {t("admin.tontine.choices.form.message")}
              <textarea
                rows={5}
                required
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setMessageEdited(true);
                }}
                className={`${INPUT} resize-none !font-normal`}
              />
              <span className="mt-1 block text-[11px] font-normal text-gray-400">
                {t("admin.tontine.choices.form.messageHint")}
              </span>
            </label>

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
                disabled={!canSubmit}
                className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("admin.tontine.choices.form.send")}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
