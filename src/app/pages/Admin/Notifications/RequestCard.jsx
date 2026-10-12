// Import Dependencies
import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import {
  CheckIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  InboxArrowDownIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { TONES, describe, formatDate, formatRelative, statusTone, styleFor } from "app/pages/Notifications/describe";
import { MAIL_PROVIDERS, buildMail, openMail, profileRows } from "app/pages/Notifications/mail";
import { decideRequest, markRead } from "app/pages/Notifications/notificationsStore";

// ----------------------------------------------------------------------

const PROVIDER_ICONS = {
  default: InboxArrowDownIcon,
  gmail: EnvelopeIcon,
  outlook: GlobeAltIcon,
};

// "Écrire un mail" : un menu à trois choix — l'application de messagerie de
// l'ordinateur (Outlook de bureau, Mail...), Gmail ou Outlook sur le web.
// Dans les trois cas le message s'ouvre déjà rédigé : destinataire = le
// membre, sujet adapté à sa demande, et son profil complet en dessous (voir
// Notifications/mail.js). Rien n'est envoyé d'ici : l'admin relit puis envoie
// depuis sa messagerie.
function MailMenu({ item }) {
  const { t } = useTranslation();

  return (
    <Menu as="div" className="relative">
      <MenuButton className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-[#52A2DF]">
        <EnvelopeIcon aria-hidden="true" className="size-4 text-[#52A2DF]" />
        {t("notifications.mail.button")}
        <ChevronDownIcon aria-hidden="true" className="size-4 text-gray-400" />
      </MenuButton>
      <MenuItems
        anchor="bottom start"
        className="z-50 w-72 rounded-2xl bg-white p-2 shadow-xl outline-none ring-1 ring-black/5 [--anchor-gap:6px]"
      >
        <p className="px-3 pb-1.5 pt-1 text-xs text-gray-500">{t("notifications.mail.hint")}</p>
        {MAIL_PROVIDERS.map((provider) => {
          const Icon = PROVIDER_ICONS[provider.key];
          return (
            <MenuItem key={provider.key}>
              <button
                type="button"
                onClick={() => {
                  markRead("admin", item.id);
                  openMail(provider.key, buildMail(item, t));
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-700 data-[focus]:bg-gray-50"
              >
                <Icon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                {t(`notifications.mail.providers.${provider.key}`)}
              </button>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}

// Confirmation avant de valider ou refuser une SUPPRESSION DE COMPTE : c'est
// la seule demande dont la réponse engage le membre sur le fond (tontine en
// cours, solde de Coins).
function DeleteDecisionDialog({ open, decision, onClose, onConfirm }) {
  const { t } = useTranslation();
  const validated = decision === "validated";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div aria-hidden="true" className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
          <span
            className={clsx(
              "mx-auto flex size-12 items-center justify-center rounded-full",
              validated ? "bg-orange-50 text-[#EE7115]" : "bg-gray-100 text-gray-500",
            )}
          >
            {validated ? <CheckIcon aria-hidden="true" className="size-6" /> : <XMarkIcon aria-hidden="true" className="size-6" />}
          </span>
          <DialogTitle className="mt-4 text-base font-bold text-gray-900">
            {t(`notifications.confirmDelete.${validated ? "validateTitle" : "refuseTitle"}`)}
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-600">
            {t(`notifications.confirmDelete.${validated ? "validateText" : "refuseText"}`)}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className={clsx(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90",
                validated ? "bg-[#EE7115]" : "bg-gray-700",
              )}
            >
              {t(`notifications.confirmDelete.${validated ? "validateYes" : "refuseYes"}`)}
            </button>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("notifications.confirmDelete.cancel")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// Carte d'une DEMANDE de membre (page Notifications de l'admin) : qui
// demande quoi, depuis quand, le profil du membre (déroulant), puis les
// actions — "Valider", "Refuser" tant que la demande est en attente, et
// "Écrire un mail" tout le temps. Décider prévient le membre (une
// notification de décision lui arrive, voir notificationsStore.js).
//
// À savoir : "Valider" enregistre la décision et en informe le membre ; elle
// ne modifie pas encore ses niveaux, ses Coins ni son compte (rien n'est
// branché au serveur pour l'instant) — l'action réelle se fait ensuite
// dans les pages de gestion.
export function RequestCard({ item }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const { title, text } = describe(item, t, locale);
  const { Icon, tone } = styleFor(item);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState(null);
  const pending = item.status === "pending";
  const rows = profileRows(item.member ?? {}, t);

  const decide = (status) => {
    if (item.type === "deleteAccount") {
      setPendingDecision(status);
      return;
    }
    decideRequest(item.id, status);
  };

  return (
    <article
      onClick={() => !item.read && markRead("admin", item.id)}
      className={clsx(
        "rounded-2xl bg-white p-4 shadow-sm ring-1 sm:p-5",
        pending ? "ring-[#EE7115]/30" : "ring-black/5",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={clsx("flex size-11 shrink-0 items-center justify-center rounded-full", TONES[tone])}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            <span className={clsx("rounded-full px-2.5 py-0.5 text-[11px] font-bold", statusTone(item.status))}>
              {t(`notifications.status.${item.status}`)}
            </span>
            {!item.read && <span className="size-2.5 rounded-full bg-[#EE7115]" title={t("notifications.unread")} />}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{text}</p>
          <p className="mt-1 text-xs text-gray-400">
            {formatRelative(item.createdAt, locale)}
            {item.decidedAt && (
              <> · {t(`notifications.decidedOn.${item.status}`, { date: formatDate(item.decidedAt, locale) })}</>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        {pending && (
          <>
            <button
              type="button"
              onClick={() => decide("validated")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <CheckIcon aria-hidden="true" className="size-4" />
              {t("notifications.validate")}
            </button>
            <button
              type="button"
              onClick={() => decide("refused")}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
            >
              <XMarkIcon aria-hidden="true" className="size-4" />
              {t("notifications.refuse")}
            </button>
          </>
        )}
        <MailMenu item={item} />
        <button
          type="button"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen((value) => !value)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.08]"
        >
          <UserCircleIcon aria-hidden="true" className="size-4" />
          {profileOpen ? t("notifications.profile.hide") : t("notifications.profile.show")}
          <ChevronDownIcon aria-hidden="true" className={clsx("size-4 transition-transform", profileOpen && "rotate-180")} />
        </button>
      </div>

      {profileOpen && (
        <dl data-testid="member-profile" className="mt-4 grid gap-x-6 gap-y-2.5 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{row.label}</dt>
              <dd className="mt-0.5 break-words font-semibold text-gray-800">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <DeleteDecisionDialog
        open={pendingDecision !== null}
        decision={pendingDecision}
        onClose={() => setPendingDecision(null)}
        onConfirm={() => {
          decideRequest(item.id, pendingDecision);
          setPendingDecision(null);
        }}
      />
    </article>
  );
}
