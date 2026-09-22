// Import Dependencies
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import clsx from "clsx";
import {
  KeyIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { setAdminSecret } from "api/adminHeaders";
import { listerEnAttente } from "api/demandesInscription";
import { REDIRECT_URL_KEY } from "constants/app.constant";

// ----------------------------------------------------------------------

// Ecran d'entree du secret admin (x-admin-secret), interim en attendant un
// vrai systeme de roles cote backend (voir middleware/AdminSecretGuard.jsx
// et api/adminHeaders.js). On verifie le secret en l'essayant sur un
// endpoint reel avant de le stocker, pour eviter d'enregistrer une valeur
// fausse en silence.
export default function AdminConnexion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!secret.trim()) {
      setError("Ce champ est requis");
      return;
    }

    setStatus("checking");
    setError("");
    setAdminSecret(secret.trim());

    try {
      await listerEnAttente();
      navigate(searchParams.get(REDIRECT_URL_KEY) || "/admin/membres", { replace: true });
    } catch (err) {
      setAdminSecret(null);
      setStatus("idle");
      setError(err.status === 401 ? "Secret admin invalide" : "Impossible de vérifier le secret pour le moment");
    }
  };

  return (
    <Page title="Connexion admin">
      <main className="flex min-h-100vh items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <p className="text-xl font-extrabold text-gray-900">Connexion admin</p>
          <p className="mt-2 text-sm text-gray-600">
            Renseigne le secret admin pour accéder au back-office.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-gray-700">
              Secret admin
              <div className="relative mt-1.5">
                <KeyIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#52A2DF]"
                />
                <input
                  type="password"
                  autoComplete="off"
                  value={secret}
                  onChange={(event) => {
                    setSecret(event.target.value);
                    setError("");
                  }}
                  className={clsx(
                    "mt-0 w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors duration-200",
                    error
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#52A2DF]/[0.32] focus:border-[#52A2DF]",
                  )}
                />
              </div>
            </label>

            {error && (
              <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                {error}
              </span>
            )}

            <button
              type="submit"
              disabled={status === "checking"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "checking" ? (
                <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <>
                  Entrer
                  <ArrowRightIcon aria-hidden="true" className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </Page>
  );
}
