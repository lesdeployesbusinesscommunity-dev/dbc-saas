// Import Dependencies
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  UserIcon,
  TrophyIcon,
  IdentificationIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------

// Identifiants de test : aucun backend n'est branché pour l'instant (même
// logique que Inscription/index.jsx — l'intégration API est mise de côté),
// donc une seule combinaison nom + niveau + matricule est acceptée en dur.
// Reprend un membre déjà présent dans les données de démo de l'espace
// admin (voir Admin/Membres/mockData.js) pour rester cohérent.
const TEST_CREDENTIALS = {
  nom: "Hubert Wakap",
  niveau: "starter",
  matricule: "DBC-1-0001",
};

const normalize = (value) => value.trim().toLowerCase();

// Champ avec icône + validation inline "moderne" : bordure et message
// rouge sous le champ dès qu'il est invalide, avec une petite animation
// d'apparition en fondu + glissement — remplace l'infobulle native du
// navigateur ("Please fill in this field"), jugée démodée, sans revenir à
// un `alert()` façon site des années 2000 non plus.
function FieldInput({ label, icon: Icon, error, ...inputProps }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <div className="relative mt-1.5">
        <Icon
          aria-hidden="true"
          className={clsx(
            "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors duration-200",
            error ? "text-red-500" : "text-[#52A2DF]",
          )}
        />
        <input
          {...inputProps}
          aria-invalid={error ? "true" : "false"}
          className={clsx(
            "mt-0 w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors duration-200 placeholder:text-gray-400",
            error
              ? "border-red-400 focus:border-red-500"
              : "border-[#52A2DF]/[0.32] focus:border-[#52A2DF]",
          )}
        />
      </div>
      <span
        className={clsx(
          "grid text-xs font-medium text-red-600 transition-all duration-200 ease-out",
          error ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <span className="flex items-center gap-1 overflow-hidden">
          <ExclamationCircleIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </span>
      </span>
    </label>
  );
}

// Même principe pour le <select> "Niveau".
function FieldSelect({ label, icon: Icon, error, children, ...selectProps }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <div className="relative mt-1.5">
        <Icon
          aria-hidden="true"
          className={clsx(
            "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors duration-200",
            error ? "text-red-500" : "text-[#52A2DF]",
          )}
        />
        <select
          {...selectProps}
          aria-invalid={error ? "true" : "false"}
          className={clsx(
            "mt-0 w-full appearance-none rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors duration-200",
            error
              ? "border-red-400 focus:border-red-500"
              : "border-[#52A2DF]/[0.32] focus:border-[#52A2DF]",
          )}
        >
          {children}
        </select>
      </div>
    </label>
  );
}

// Page "Se connecter" = /login (lien présent dans PublicHeader et au bas
// du formulaire d'inscription). Même habillage que Inscription/index.jsx
// (écran plein sans header/footer, panneau "Afrique" à gauche, formulaire
// à droite) mais en une seule étape : Nom, Niveau, Matricule. Aucun
// backend branché pour l'instant — voir TEST_CREDENTIALS plus haut — donc
// la connexion redirige simplement vers /admin quand les 3 champs
// correspondent, ou affiche un message d'erreur générique sinon.
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", niveau: levels[0].key, matricule: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking

  const updateField = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    // Efface l'erreur du champ dès qu'on recommence à le modifier, pour un
    // retour visuel immédiat plutôt que d'attendre un nouveau submit.
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
    if (formError) setFormError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.nom.trim()) nextErrors.nom = "Ce champ est requis";
    if (!form.matricule.trim()) nextErrors.matricule = "Ce champ est requis";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("");
      return;
    }

    setStatus("checking");
    setTimeout(() => {
      const isValid =
        normalize(form.nom) === normalize(TEST_CREDENTIALS.nom) &&
        form.niveau === TEST_CREDENTIALS.niveau &&
        normalize(form.matricule) === normalize(TEST_CREDENTIALS.matricule);

      if (isValid) {
        navigate("/admin");
        return;
      }

      setStatus("idle");
      setFormError("Mauvais matricule ou nom et niveau");
    }, 600);
  };

  return (
    <Page title="Se connecter">
      <main className="grid min-h-100vh grid-cols-1 bg-white lg:grid-cols-2">
        {/* Panneau décoratif, identique à Inscription/index.jsx (même
            image, même halo) — texte adapté pour un retour plutôt qu'une
            première arrivée. Caché sur mobile. */}
        <div className="relative hidden flex-col bg-[#52A2DF] lg:flex lg:p-12">
          <Link to="/accueil" className="flex shrink-0 items-center gap-3">
            <img
              src="/logo-icon.jpg"
              alt="Logo DBC"
              className="h-12 w-auto rounded-lg object-contain"
            />
            <p className="text-sm font-bold text-white">
              Les Déployés
              <br />
              Business Community
            </p>
          </Link>

          <div className="relative flex flex-1 items-center justify-center py-8">
            <div
              aria-hidden="true"
              className="absolute size-72 rounded-full bg-[#52A2DF] blur-3xl"
            />
            <img
              src="/Afrique.png"
              alt="Carte d'affaires en Afrique"
              className="relative w-full max-w-xs drop-shadow-2xl sm:max-w-sm"
            />
          </div>

          <div className="relative z-10 shrink-0">
            <p className="text-3xl font-extrabold leading-tight text-white">
              Content de te <span className="text-[white]">revoir</span>
            </p>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              Connecte-toi avec ton nom, ton niveau DBC et ton matricule pour
              retrouver ton espace membre.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="relative flex flex-col items-center justify-center bg-white px-4 py-14 sm:px-6 lg:px-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 sm:left-6 lg:left-8 lg:top-8"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-5" />
          </button>

          <div className="w-full max-w-md">
            <Link to="/accueil" className="mb-8 flex items-center gap-3 lg:hidden">
              <img
                src="/logo-icon.jpg"
                alt="Logo DBC"
                className="h-11 w-auto object-contain"
              />
              <p className="text-sm font-bold text-[#EE7115]">
                Les Déployés
                <br />
                Business Community
              </p>
            </Link>

            <p className="text-2xl font-extrabold text-gray-900">
              Content de te <span className="text-[#EE7115]">revoir</span>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Renseigne ton nom, ton niveau DBC et ton matricule pour accéder
              à ton espace.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
              <FieldInput
                label="Nom"
                icon={UserIcon}
                type="text"
                value={form.nom}
                onChange={updateField("nom")}
                placeholder="Ton nom"
                error={fieldErrors.nom}
              />
              <FieldSelect
                label="Niveau"
                icon={TrophyIcon}
                value={form.niveau}
                onChange={updateField("niveau")}
              >
                {levels.map((level) => (
                  <option key={level.key} value={level.key}>
                    {t(`simulateur.levels.${level.key}.name`)}
                  </option>
                ))}
              </FieldSelect>
              <FieldInput
                label="Matricule"
                icon={IdentificationIcon}
                type="text"
                value={form.matricule}
                onChange={updateField("matricule")}
                placeholder="Ex : DBC-1-0001"
                error={fieldErrors.matricule}
              />

              {/* Erreur générale (mauvaise combinaison) : ne précise jamais
                  lequel des 3 champs est en cause, pour rester au même
                  niveau de discrétion qu'un vrai écran de connexion. */}
              <span
                className={clsx(
                  "grid transition-all duration-200 ease-out",
                  formError ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <span className="overflow-hidden">
                  <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                    {formError}
                  </span>
                </span>
              </span>

              <button
                type="submit"
                disabled={status === "checking"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {status === "checking" ? (
                  <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <>
                    Se connecter
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link
                to="/inscription"
                className="font-semibold text-[#EE7115] hover:underline"
              >
                Rejoindre la DBC
              </Link>
            </p>
          </div>
        </div>
      </main>
    </Page>
  );
}
