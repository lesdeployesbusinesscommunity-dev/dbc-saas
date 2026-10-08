// Import Dependencies
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

// Local Imports
import { endSession } from "./session";

// ----------------------------------------------------------------------

// Fenêtre de confirmation AVANT de se déconnecter : une déconnexion ferme
// la session (voir session.js) et renvoie vers /login, donc on ne la
// déclenche jamais d'un seul clic. Utilisée par le menu du profil (en-tête
// des espaces membre et admin, voir ProfileMenu.jsx) et par le bouton
// "Se déconnecter" de Paramètres > Mon compte.
//
// "ns" : "membre" ou "admin" — les textes viennent de "<ns>.profileMenu.confirm"
// (tutoiement côté membre, formulation neutre côté admin).
// "Annuler" prend le focus : une touche Entrée distraite ne déconnecte pas.
export function LogoutConfirmDialog({ open, onClose, ns }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const confirm = () => {
    onClose();
    endSession("logout");
    navigate("/login", { replace: true, state: { reason: "logout" } });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div aria-hidden="true" className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-orange-50 text-[#EE7115]">
            <ArrowRightOnRectangleIcon aria-hidden="true" className="size-6" />
          </span>
          <DialogTitle className="mt-4 text-base font-bold text-gray-900">
            {t(`${ns}.profileMenu.confirm.title`)}
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-600">{t(`${ns}.profileMenu.confirm.text`)}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={confirm}
              className="flex-1 rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t(`${ns}.profileMenu.confirm.yes`)}
            </button>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t(`${ns}.profileMenu.confirm.cancel`)}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
