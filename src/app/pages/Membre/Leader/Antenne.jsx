// Import Dependencies
import { useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import {
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { useMembersFormat } from "app/pages/Admin/Membres/useMembersFormat";
import { LevelBadge } from "app/pages/Admin/Tontine/LevelBadge";
import { normalizeSearchText } from "app/pages/Admin/searchUtils";
import { currentMember } from "../currentMember";
import { isDialable, mailtoLink, telLink, whatsappLink } from "./contactUtils";
import { personKey } from "app/pages/Annonces/audience";
import { publishAnnouncement } from "app/pages/Annonces/announcementsStore";
import { LeaderShell } from "./LeaderShell";
import { useAntenneMembers, useLeaderProfile } from "./leaderAccess";
import { logReminder, useReminders } from "./remindersStore";

// ----------------------------------------------------------------------

const sameDay = (iso) => new Date(iso).toDateString() === new Date().toDateString();

function StatTile({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className={clsx("mt-1 text-2xl font-extrabold", tone)}>{value}</p>
    </div>
  );
}

function ContributionChip({ contribution }) {
  const { t } = useTranslation();
  if (contribution.state === "late") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-200">
        <ExclamationTriangleIcon aria-hidden="true" className="size-3.5" />
        {t("membre.leader.antenne.status.late", { count: contribution.missed || 1 })}
      </span>
    );
  }
  if (contribution.state === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-600/25">
        <CheckCircleIcon aria-hidden="true" className="size-3.5" />
        {t("membre.leader.antenne.status.ok")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-inset ring-gray-300/60">
      {t("membre.leader.antenne.status.none")}
    </span>
  );
}

// Le message de relance, écrit au VOUVOIEMENT (il part à un membre) et
// pré-rempli : le leader le relit, puis l'envoie — "Envoyer la relance" le
// dépose dans les notifications du membre (toujours possible, même sans numéro
// ni e-mail) ; WhatsApp et l'e-mail ouvrent l'application du leader, qui
// appuie lui-même sur "Envoyer" là-bas.
function useReminderMessage() {
  const { t, i18n } = useTranslation();
  const leader = useLeaderProfile();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date());

  return (member) => {
    const missed = Math.max(1, member.contribution.missed);
    const params = {
      count: missed,
      name: member.name.split(" ")[0],
      leader: currentMember.name,
      branch: leader?.branchName ?? "",
      level: member.levelKey ? t(`simulateur.levels.${member.levelKey}.name`) : "",
      amount: new Intl.NumberFormat(locale).format(member.contribution.amount),
      total: new Intl.NumberFormat(locale).format(member.contribution.amount * missed),
      month,
    };
    return {
      text: t("membre.leader.antenne.reminder.message", params),
      subject: t("membre.leader.antenne.reminder.subject"),
    };
  };
}

function ReminderDialog({ member, onClose }) {
  const { t } = useTranslation();
  const buildMessage = useReminderMessage();
  const leader = useLeaderProfile();
  const message = member ? buildMessage(member) : null;
  const canWhatsapp = member ? isDialable(member.phone) : false;
  const canMail = Boolean(member?.email);

  const done = (channel) => {
    logReminder(member.key, channel);
    onClose();
  };

  // La relance arrive chez le membre comme un message privé du leader, dans son
  // fil et ses notifications (importante : elle passe même s'il a coupé les
  // notifications de la communauté). "kind: reminder" la garde hors de la liste
  // des annonces du leader.
  const sendInApp = () => {
    const key = personKey({ matricule: member.matricule, name: member.name });
    publishAnnouncement({
      kind: "reminder",
      title: message.subject,
      body: message.text,
      importance: "important",
      author: {
        role: "leader",
        name: currentMember.name,
        matricule: currentMember.matricule,
        branchName: leader?.branchName ?? "",
      },
      audience: { type: "members", total: 1, names: [member.name] },
      recipients: [key],
    });
    done("app");
  };

  return (
    <Dialog open={Boolean(member)} onClose={onClose} className="relative z-50">
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex w-screen items-start justify-center overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <DialogTitle className="text-base font-bold text-gray-900">
            {t("membre.leader.antenne.reminder.title", { name: member?.name ?? "" })}
          </DialogTitle>
          <p className="mt-1 text-xs text-gray-500">{t("membre.leader.antenne.reminder.hint")}</p>

          <p
            data-testid="reminder-message"
            className="mt-4 whitespace-pre-line rounded-xl bg-[#DCF8C6]/60 p-4 text-sm leading-relaxed text-gray-800"
          >
            {message?.text}
          </p>

          {!canWhatsapp && !canMail && (
            <p className="mt-3 text-xs text-gray-500">{t("membre.leader.antenne.reminder.noContact")}</p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t("membre.leader.report.confirm.cancel")}
            </button>
            {canMail && (
              <a
                href={mailtoLink(member.email, message.subject, message.text)}
                onClick={() => done("email")}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                {t("membre.leader.antenne.reminder.email")}
              </a>
            )}
            {canWhatsapp && (
              <a
                href={whatsappLink(member.phone, message.text)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => done("whatsapp")}
                className="rounded-lg border border-[#16A34A] px-4 py-2 text-sm font-bold text-[#16A34A] hover:bg-[#16A34A]/[0.06]"
              >
                {t("membre.leader.antenne.reminder.whatsapp")}
              </a>
            )}
            <button
              type="button"
              onClick={sendInApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#EE7115] px-5 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <PaperAirplaneIcon aria-hidden="true" className="size-4" />
              {t("membre.leader.antenne.reminder.send")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function MemberRow({ member, reminder, onRemind }) {
  const { t } = useTranslation();
  const { fullDate } = useMembersFormat();
  const late = member.contribution.state === "late";
  const today = reminder && sameDay(reminder.at);

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Avatar name={member.name} size="size-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{member.name}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0 text-[#52A2DF]" />
            {member.city}
            {member.matricule && <span className="text-gray-400"> · {member.matricule}</span>}
          </p>
          {reminder && (
            <p className="mt-1 text-xs text-gray-500">
              {today
                ? t("membre.leader.antenne.lastReminder.today", { channel: t(`membre.leader.antenne.channel.${reminder.channel}`) })
                : t("membre.leader.antenne.lastReminder.on", {
                    date: fullDate(reminder.at),
                    channel: t(`membre.leader.antenne.channel.${reminder.channel}`),
                  })}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {member.levelKey && <LevelBadge levelKey={member.levelKey} />}
        <ContributionChip contribution={member.contribution} />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:w-44 sm:justify-end">
        {late ? (
          <button
            type="button"
            onClick={() => onRemind(member)}
            className="flex items-center gap-1.5 rounded-lg bg-[#EE7115] px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            <BellAlertIcon aria-hidden="true" className="size-4" />
            {reminder ? t("membre.leader.antenne.remindAgain") : t("membre.leader.antenne.remind")}
          </button>
        ) : (
          isDialable(member.phone) && (
            <a
              href={telLink(member.phone)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              <PhoneIcon aria-hidden="true" className="size-4" />
              {t("membre.leader.contact.call")}
            </a>
          )
        )}
      </div>
    </li>
  );
}

// "Mon antenne" (/membre/leader/antenne) : les membres de la zone du leader
// et l'état de leur cotisation du tour. Pour un membre en retard, le bouton
// "Relancer" prépare un message de rappel (WhatsApp ou e-mail) que le leader
// relit et envoie lui-même — le site n'envoie rien tout seul. Le journal des
// relances (voir remindersStore.js) évite de relancer deux fois sans le voir.
export default function LeaderAntenne() {
  const { t } = useTranslation();
  const roster = useAntenneMembers();
  const reminders = useReminders();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [target, setTarget] = useState(null);

  const lateCount = roster.filter((member) => member.contribution.state === "late").length;

  const visible = useMemo(() => {
    const text = normalizeSearchText(query);
    return roster
      .filter((member) => filter === "all" || (filter === "late") === (member.contribution.state === "late"))
      .filter((member) => !text || normalizeSearchText(`${member.name} ${member.city} ${member.matricule}`).includes(text));
  }, [roster, filter, query]);

  const filters = [
    { key: "all", label: t("membre.leader.antenne.filter.all"), count: roster.length },
    { key: "late", label: t("membre.leader.antenne.filter.late"), count: lateCount },
    { key: "ok", label: t("membre.leader.antenne.filter.ok"), count: roster.length - lateCount },
  ];

  return (
    <LeaderShell
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("membre.leader.antenne.searchPlaceholder")}
    >
      <p className="max-w-3xl text-sm text-gray-600">{t("membre.leader.antenne.subtitle")}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label={t("membre.leader.antenne.stats.members")} value={roster.length} tone="text-gray-900" />
        <StatTile
          label={t("membre.leader.antenne.stats.late")}
          value={lateCount}
          tone={lateCount > 0 ? "text-red-600" : "text-gray-900"}
        />
        <StatTile label={t("membre.leader.antenne.stats.ok")} value={roster.length - lateCount} tone="text-green-700" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("membre.leader.antenne.filter.label")}>
        {filters.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === key ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-black/5 hover:text-gray-900",
            )}
          >
            {label} · {count}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-14 text-center">
          <UsersIcon aria-hidden="true" className="size-10 text-gray-300" />
          <p className="mt-3 text-sm font-bold text-gray-900">{t("membre.leader.antenne.empty.title")}</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{t("membre.leader.antenne.empty.description")}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((member) => (
            <MemberRow key={member.key} member={member} reminder={reminders[member.key]} onRemind={setTarget} />
          ))}
        </ul>
      )}

      <ReminderDialog member={target} onClose={() => setTarget(null)} />
    </LeaderShell>
  );
}
