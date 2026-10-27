// Import Dependencies
import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  XMarkIcon,
  EnvelopeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { useMonthLabels } from "../components/monthUtils";
import { ConfirmDialog } from "../Membres/ConfirmDialog";
import { useMembersFormat } from "../Membres/useMembersFormat";
import { CampaignStatusBadge } from "./ChoiceCampaigns";
import { buildReminder, sendEmailReminder, sendGroupEmail, sendWhatsAppReminder } from "./choiceMessages";
import { nextGroupLetter } from "./mockData";
import {
  answerCounts,
  applyProposal,
  choiceRank,
  isOrderComplete,
  isPastDeadline,
  recordReminder,
  setAssignment,
  setCampaignStatus,
  useMonthChoices,
} from "./monthChoices";

// ----------------------------------------------------------------------

const RANK_STYLE = {
  1: "bg-green-50 text-green-700 ring-green-600/20",
  2: "bg-green-50 text-green-700 ring-green-600/20",
  3: "bg-green-50 text-green-700 ring-green-600/20",
  0: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

// Une demande de choix en détail : où en sont les réponses, les relances
// par e-mail et WhatsApp, puis l'ORDRE DE PASSAGE — un mois par membre, que
// l'administration décide à partir des choix (proposition automatique ou à
// la main). "Valider l'ordre" crée le groupe de tontine dans cet ordre.
export function CampaignDetailModal({ campaignId, groups, onClose, onValidate }) {
  const { t } = useTranslation();
  const { monthYear, monthShort } = useMonthLabels();
  const { fullDate, dateTime } = useMembersFormat();
  const { campaigns } = useMonthChoices();
  const [confirmValidate, setConfirmValidate] = useState(false);

  const campaign = campaigns.find((item) => item.id === campaignId);
  if (!campaign) return null;

  const { answered, total } = answerCounts(campaign);
  const validated = campaign.status === "validated";
  const closedForAnswers = campaign.status !== "open";
  const complete = isOrderComplete(campaign);
  const letter = nextGroupLetter(groups, campaign.levelKey);
  const fmt = { monthYear, fullDate };
  const pending = campaign.targets.filter((target) => !campaign.responses[target.matricule]);

  const remind = (target, channel) => {
    const reminder = buildReminder(campaign, target, t, fmt);
    if (channel === "email") sendEmailReminder(target, reminder);
    else sendWhatsAppReminder(target, reminder);
    recordReminder(campaign.id, target.matricule, channel);
  };

  const remindAllByEmail = () => {
    const withEmail = pending.filter((target) => target.email);
    if (withEmail.length === 0) return;
    sendGroupEmail(withEmail, buildReminder(campaign, withEmail[0], t, fmt));
    withEmail.forEach((target) => recordReminder(campaign.id, target.matricule, "email"));
  };

  const takenBy = (month) =>
    campaign.targets.filter((target) => campaign.order[target.matricule] === month);

  // Valider l'ordre : chaque membre reçoit le mois qui lui est attribué. Pour
  // un nouveau groupe, on le crée avec le nombre de places choisi (les mois
  // sans membre restent libres) ; pour une demande sur les mois libres d'un
  // groupe ouvert, les membres y sont simplement ajoutés.
  const targetGroup = groups.find((group) => group.id === campaign.targetGroupId) ?? null;
  const joining = Boolean(campaign.targetGroupId);
  const validate = () => {
    const members = [...campaign.targets]
      .sort((a, b) => campaign.order[a.matricule].localeCompare(campaign.order[b.matricule]))
      .map(({ id, name, city, matricule }) => ({ id, name, city, matricule, month: campaign.order[matricule] }));
    onValidate(
      campaign,
      joining
        ? { groupId: campaign.targetGroupId, members }
        : {
            id: `${campaign.levelKey}-${letter}`,
            levelKey: campaign.levelKey,
            letter,
            startMonth: `${campaign.startMonth}-01`,
            capacity: campaign.capacity ?? campaign.months.length,
            members: members.map(({ id, name, city, month }) => ({ id, name, city, month })),
          },
    );
    setConfirmValidate(false);
  };

  return (
    <Dialog open onClose={confirmValidate ? () => {} : onClose} className="relative z-40">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-4 sm:items-center">
        <DialogPanel className="my-4 w-full max-w-5xl rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {t("admin.tontine.choices.detail.title", { level: t(`simulateur.levels.${campaign.levelKey}.name`) })}
                </DialogTitle>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {t("admin.tontine.choices.period", {
                  from: monthYear(campaign.months[0]),
                  to: monthYear(campaign.months[campaign.months.length - 1]),
                })}
                {" · "}
                {isPastDeadline(campaign) && campaign.status === "open"
                  ? t("admin.tontine.choices.deadlinePassed", { date: fullDate(campaign.deadline) })
                  : t("admin.tontine.choices.before", { date: fullDate(campaign.deadline) })}
              </p>
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

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              {t("admin.tontine.choices.detail.messageSent")}
            </p>
            <p className="mt-1.5 whitespace-pre-line text-sm text-gray-600">{campaign.message}</p>
            <p className="mt-2 text-xs font-semibold text-gray-700">
              {t("admin.tontine.choices.answered", { answered, total })}
            </p>
          </div>

          {validated && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              <CheckCircleIcon aria-hidden="true" className="size-5" />
              {t(joining ? "admin.tontine.choices.detail.validatedJoin" : "admin.tontine.choices.detail.validatedInfo", {
                id: campaign.groupId?.split("-").pop(),
              })}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-900">{t("admin.tontine.choices.detail.answersTitle")}</h3>
            {!validated && (
              <div className="flex flex-wrap gap-2">
                {campaign.channels.email && pending.some((target) => target.email) && (
                  <button
                    type="button"
                    onClick={remindAllByEmail}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <EnvelopeIcon aria-hidden="true" className="size-3.5" />
                    {t("admin.tontine.choices.detail.emailPending", { count: pending.filter((p) => p.email).length })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => applyProposal(campaign.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#52A2DF] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  <SparklesIcon aria-hidden="true" className="size-3.5" />
                  {t("admin.tontine.choices.detail.propose")}
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">{t("admin.tontine.choices.detail.proposeHint")}</p>

          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.choices.detail.columns.member")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.choices.detail.columns.choices")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.choices.detail.columns.reminders")}</th>
                  <th scope="col" className="px-3 py-3">{t("admin.tontine.choices.detail.columns.turn")}</th>
                </tr>
              </thead>
              <tbody>
                {campaign.targets.map((target) => {
                  const response = campaign.responses[target.matricule];
                  const reminders = campaign.reminders[target.matricule] ?? {};
                  const rank = choiceRank(campaign, target.matricule);
                  const assigned = campaign.order[target.matricule] ?? "";
                  const duplicate = assigned && takenBy(assigned).length > 1;
                  return (
                    <tr key={target.matricule} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={target.name} size="size-9" />
                          <div className="leading-tight">
                            <p className="font-semibold text-gray-900">{target.name}</p>
                            <p className="text-xs text-gray-400">{target.matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {response ? (
                          <div>
                            <ol className="flex flex-wrap gap-1.5">
                              {response.months.map((month, index) => (
                                <li
                                  key={month}
                                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700"
                                >
                                  <span className="text-[10px] text-gray-400">{index + 1}</span>
                                  {monthShort(month)}
                                </li>
                              ))}
                            </ol>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {t("admin.tontine.choices.detail.answeredAt", { date: dateTime(dayjs(response.at).format("YYYY-MM-DDTHH:mm")) })}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            {t("admin.tontine.choices.detail.noAnswer")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            disabled={validated || !target.email}
                            onClick={() => remind(target, "email")}
                            title={target.email ? target.email : t("admin.tontine.choices.detail.noEmail")}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <EnvelopeIcon aria-hidden="true" className="size-3.5" />
                            {t("admin.tontine.choices.detail.email")}
                          </button>
                          <button
                            type="button"
                            disabled={validated || !target.whatsapp}
                            onClick={() => remind(target, "whatsapp")}
                            title={target.whatsapp ? target.whatsapp : t("admin.tontine.choices.detail.noWhatsapp")}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChatBubbleOvalLeftEllipsisIcon aria-hidden="true" className="size-3.5" />
                            WhatsApp
                          </button>
                        </div>
                        {(reminders.email || reminders.whatsapp) && (
                          <p className="mt-1 text-[11px] text-gray-400">
                            {[
                              reminders.email &&
                                t("admin.tontine.choices.detail.sentEmail", { date: fullDate(dayjs(reminders.email).format("YYYY-MM-DD")) }),
                              reminders.whatsapp &&
                                t("admin.tontine.choices.detail.sentWhatsapp", { date: fullDate(dayjs(reminders.whatsapp).format("YYYY-MM-DD")) }),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label={t("admin.tontine.choices.detail.turnFor", { name: target.name })}
                            disabled={validated}
                            value={assigned}
                            onChange={(event) => setAssignment(campaign.id, target.matricule, event.target.value)}
                            className={clsx(
                              "rounded-lg border bg-white px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-[#52A2DF] disabled:bg-gray-50",
                              duplicate ? "border-red-400" : "border-gray-200",
                            )}
                          >
                            <option value="">{t("admin.tontine.choices.detail.unassigned")}</option>
                            {campaign.months.map((month) => (
                              <option key={month} value={month}>
                                {monthYear(month)}
                              </option>
                            ))}
                          </select>
                          {rank !== null && (
                            <span
                              className={clsx(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                                RANK_STYLE[rank],
                              )}
                            >
                              {rank > 0
                                ? t("admin.tontine.choices.detail.rank", { n: rank })
                                : t("admin.tontine.choices.detail.outOfChoices")}
                            </span>
                          )}
                        </div>
                        {duplicate && (
                          <p className="mt-1 text-[11px] font-semibold text-red-600">
                            {t("admin.tontine.choices.detail.duplicate")}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-sm font-bold text-gray-900">{t("admin.tontine.choices.detail.previewTitle")}</h3>
          <ol className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {campaign.months.map((month, index) => {
              const holders = takenBy(month);
              return (
                <li
                  key={month}
                  className={clsx(
                    "rounded-xl border p-3 text-xs",
                    holders.length > 1
                      ? "border-red-300 bg-red-50"
                      : holders.length === 1
                        ? "border-gray-100 bg-white"
                        : "border-dashed border-gray-300 bg-gray-50",
                  )}
                >
                  <p className="font-semibold text-gray-400">
                    {t("admin.tontine.choices.detail.tourN", {
                      n: targetGroup?.schedule.find((slot) => slot.month.format("YYYY-MM") === month)?.tour ?? index + 1,
                    })} · {monthShort(month)}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-gray-900">
                    {holders.length ? holders.map((holder) => holder.name).join(", ") : t("admin.tontine.choices.detail.free")}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              {!validated && (
                <button
                  type="button"
                  onClick={() => setCampaignStatus(campaign.id, closedForAnswers ? "open" : "closed")}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  {closedForAnswers
                    ? t("admin.tontine.choices.detail.reopen")
                    : t("admin.tontine.choices.detail.closeAnswers")}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!validated && !complete && (
                <span className="text-xs text-gray-400">{t("admin.tontine.choices.detail.needComplete")}</span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                {t("admin.tontine.detail.close")}
              </button>
              {!validated && (
                <button
                  type="button"
                  disabled={!complete || (!joining && !letter)}
                  onClick={() => setConfirmValidate(true)}
                  className="rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("admin.tontine.choices.detail.validate")}
                </button>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>

      {confirmValidate && (
        <ConfirmDialog
          open
          title={t(joining ? "admin.tontine.choices.detail.confirmJoinTitle" : "admin.tontine.choices.detail.confirmTitle")}
          description={t(joining ? "admin.tontine.choices.detail.confirmJoin" : "admin.tontine.choices.detail.confirmText", {
            level: t(`simulateur.levels.${campaign.levelKey}.name`),
            letter: joining ? (targetGroup?.letter ?? "") : letter,
          })}
          confirmLabel={t(joining ? "admin.tontine.choices.detail.confirmJoinLabel" : "admin.tontine.choices.detail.confirmLabel")}
          onConfirm={validate}
          onCancel={() => setConfirmValidate(false)}
        />
      )}
    </Dialog>
  );
}
