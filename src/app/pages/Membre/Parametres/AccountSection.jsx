// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightOnRectangleIcon, ExclamationTriangleIcon, UserMinusIcon } from "@heroicons/react/24/solid";

// Local Imports
import { SettingsSection } from "app/pages/Admin/Parametres/SettingsSection";
import { LogoutConfirmDialog } from "app/pages/Auth/LogoutConfirmDialog";
import {
  submitRequest,
  isMine,
  useNotificationState,
  withdrawRequest,
} from "app/pages/Notifications/notificationsStore";

// ----------------------------------------------------------------------

// Paramètres > Mon compte : se déconnecter, et demander la suppression de
// son compte. La suppression n'est JAMAIS immédiate : le membre cotise à
// une tontine (des engagements envers les autres membres) et a un solde de
// Coins, donc la demande est envoyée à l'équipe DBC qui le recontacte
// avant de la traiter. Il peut l'annuler tant qu'elle n'est pas traitée.
// La demande part dans les Notifications de l'admin (avec le profil du
// membre, voir Notifications/notificationsStore.js) : l'admin la valide, la
// refuse ou écrit au membre, et la réponse revient ici et dans ses
// Notifications.
// "Se déconnecter" demande d'abord confirmation (voir
// Auth/LogoutConfirmDialog.jsx), puis ferme la session (voir Auth/session.js)
// et renvoie vers /login ; revenir en arrière dans le navigateur ne rouvre pas l'espace.
export function AccountSection() {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  // La dernière demande de suppression : "pending" (en attente), "validated"
  // ou "refused" (décidée par l'admin), "withdrawn" (retirée par le membre).
  const { items } = useNotificationState();
  const latest = items.find((item) => item.kind === "request" && isMine(item) && item.type === "deleteAccount");
  const status = latest?.status ?? "none";
  const requested = status === "pending";

  return (
    <SettingsSection
      Icon={UserMinusIcon}
      title={t("membre.parametres.account.title")}
      description={t("membre.parametres.account.description")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("membre.parametres.account.logout")}</p>
          <p className="mt-0.5 text-xs text-gray-500">{t("membre.parametres.account.logoutHint")}</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmingLogout(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowRightOnRectangleIcon aria-hidden="true" className="size-4" />
          {t("membre.parametres.account.logoutButton")}
        </button>
      </div>

      <LogoutConfirmDialog open={confirmingLogout} onClose={() => setConfirmingLogout(false)} ns="membre" />

      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/50 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-red-700">
          <ExclamationTriangleIcon aria-hidden="true" className="size-5 shrink-0" />
          {t("membre.parametres.account.deleteTitle")}
        </p>
        <p className="mt-1 text-xs text-gray-600">{t("membre.parametres.account.deleteHint")}</p>
        {status === "refused" && (
          <p role="status" className="mt-2 text-xs font-semibold text-gray-700">
            {t("membre.parametres.account.deleteRefused")}
          </p>
        )}

        {status === "validated" ? (
          <p role="status" className="mt-3 text-sm font-semibold text-red-700">
            {t("membre.parametres.account.deleteValidated")}
          </p>
        ) : requested ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-sm font-semibold text-red-700">
              {t("membre.parametres.account.deleteSent")}
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                withdrawRequest("deleteAccount");
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("membre.parametres.account.deleteCancel")}
            </button>
          </div>
        ) : confirming ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                submitRequest({ type: "deleteAccount" });
              }}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("membre.parametres.account.deleteConfirm")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("membre.common.cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            {t("membre.parametres.account.deleteButton")}
          </button>
        )}
      </div>
    </SettingsSection>
  );
}
