// Import Dependencies
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ClockIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { getPlatformSettings } from "app/pages/Admin/Parametres/platformSettings";
import { endSession, useSessionState } from "./session";

// ----------------------------------------------------------------------

// Durée d'inactivité (aucun clic, touche, défilement ou mouvement) avant
// la déconnexion automatique, et préavis avec compte à rebours pendant
// lequel on peut rester connecté d'un clic. La durée est celle choisie par
// l'admin (Paramètres > Comptes des membres, voir
// Admin/Parametres/platformSettings.js — 5 minutes par défaut) ; elle est
// relue à chaque vérification, donc un changement s'applique aux sessions
// déjà ouvertes.
const WARNING_MS = 60 * 1000;
const idleLimitMs = () =>
  Math.max(2 * WARNING_MS, getPlatformSettings().security.memberIdleMinutes * 60 * 1000);

// Mouvements de souris : on n'en tient compte qu'une fois toutes les 5 s
// (pas besoin de réagir à chaque pixel).
const MOVE_THROTTLE_MS = 5000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];

// Protège un espace (membre, admin...) : sans session du bon rôle, on
// renvoie vers /login en retenant la page demandée (on y revient après la
// connexion — après une actualisation, on retrouve donc la même page).
// Avec une session, affiche la page + la surveillance d'inactivité.
// Rien de l'espace n'est rendu avant la vérification : pas de flash de
// contenu sensible.
export function SessionGuard({ role }) {
  const location = useLocation();
  const { session, endReason } = useSessionState();

  // Un compte qui peut changer d'espace (l'administrateur) vient de passer à
  // l'autre mode : on ne le renvoie pas se reconnecter, on l'envoie dans
  // l'espace de son rôle actuel (la bascule le fait aussi, mais cet espace-ci
  // réagit au changement de rôle avant la navigation).
  if (session?.canSwitchRole && session.role !== role) {
    return <Navigate to={`/${session.role}/dashboard`} replace />;
  }

  if (!session || session.role !== role) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}`, reason: endReason ?? "required" }}
      />
    );
  }

  return (
    <>
      <IdleWatcher />
      <Outlet />
    </>
  );
}

// Prête à l'emploi pour router/membre.jsx (une route ne peut pas passer de
// propriété au composant).
export function MembreSessionGuard() {
  return <SessionGuard role="membre" />;
}

// Déconnecte après IDLE_LIMIT_MS sans activité. Les dernières WARNING_MS,
// une fenêtre prévient et propose de rester connecté ; pendant ce préavis,
// l'activité en arrière-plan est ignorée : il faut répondre explicitement.
// Les comparaisons se font avec l'heure réelle (Date.now), donc même un
// onglet resté en arrière-plan est déconnecté au bon moment.
function IdleWatcher() {
  const { t } = useTranslation();
  const lastActivity = useRef(Date.now());
  const lastMove = useRef(0);
  const warningRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(null); // null = pas de préavis

  const touch = useCallback(() => {
    if (!warningRef.current) lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    const onMove = () => {
      const now = Date.now();
      if (now - lastMove.current > MOVE_THROTTLE_MS) {
        lastMove.current = now;
        touch();
      }
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, touch, { passive: true }));
    window.addEventListener("pointermove", onMove, { passive: true });

    const timer = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      const limit = idleLimitMs();
      if (idle >= limit) {
        endSession("expired");
        return;
      }
      if (idle >= limit - WARNING_MS) {
        warningRef.current = true;
        setSecondsLeft(Math.ceil((limit - idle) / 1000));
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, touch));
      window.removeEventListener("pointermove", onMove);
      window.clearInterval(timer);
    };
  }, [touch]);

  const stay = () => {
    warningRef.current = false;
    lastActivity.current = Date.now();
    setSecondsLeft(null);
  };

  return (
    <Dialog open={secondsLeft !== null} onClose={() => {}} className="relative z-[100]">
      <div aria-hidden="true" className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-orange-50 text-[#EE7115]">
            <ClockIcon aria-hidden="true" className="size-6" />
          </span>
          <DialogTitle className="mt-4 text-base font-bold text-gray-900">{t("session.warnTitle")}</DialogTitle>
          <p role="timer" className="mt-2 text-sm text-gray-600">
            {t("session.warnText", { seconds: secondsLeft ?? 0 })}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={stay}
              autoFocus
              className="flex-1 rounded-xl bg-[#EE7115] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("session.stay")}
            </button>
            <button
              type="button"
              onClick={() => endSession("logout")}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("session.logout")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
