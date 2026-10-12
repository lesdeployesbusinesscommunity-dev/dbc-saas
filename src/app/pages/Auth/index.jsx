// Import Dependencies
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  TrophyIcon,
  IdentificationIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { getLockRemaining, recordFailure, recordSuccess, startSession } from "./session";

// ----------------------------------------------------------------------

// Identifiants de test : aucun backend n'est branché pour l'instant (même
// logique que Inscription/index.jsx — l'intégration API est mise de côté),
// donc deux comptes sont acceptés en dur, chacun avec niveau + matricule +
// mot de passe (le matricule, unique, est l'identifiant de connexion ; le nom
// ne sert plus à se connecter, il n'est gardé ici que comme nom de la
// session) :
// - l'administrateur de démonstration (un membre déjà présent dans les
//   données de l'espace admin, voir Admin/Membres/mockData.js) -> /admin ;
// - le membre de démonstration de l'espace membre (voir
//   Membre/currentMember.js : mêmes nom et matricule) -> /membre. Il
//   cotise à plusieurs niveaux : n'importe lequel des siens est accepté.
//
// Les mots de passe ne sont PAS écrits dans le code : ils viennent du
// fichier .env.local à la racine du projet (VITE_DEMO_ADMIN_PASSWORD et
// VITE_DEMO_MEMBER_PASSWORD — voir .env.example), ignoré par git. Pour en
// changer, modifier ce fichier puis relancer "npm run dev". Si une variable
// manque, le compte correspondant est simplement inutilisable.
// ATTENTION — démonstration seulement : Vite intègre ces valeurs dans le JS
// envoyé au navigateur, donc quelqu'un qui inspecte le site peut encore les
// lire. Une fois le backend branché, ce bloc disparaît : le mot de passe est
// alors vérifié (et stocké haché) côté serveur, jamais dans le site.
const TEST_ACCOUNTS = [
  {
    nom: "Hubert Wakap",
    niveaux: ["starter"],
    matricule: "DBC-1-0001",
    motDePasse: import.meta.env.VITE_DEMO_ADMIN_PASSWORD,
    role: "admin",
    redirectTo: "/admin",
  },
  {
    nom: "Thierry Mbida",
    niveaux: ["starter", "batisseur", "batisseurPro"],
    matricule: "DBC-1-0042",
    motDePasse: import.meta.env.VITE_DEMO_MEMBER_PASSWORD,
    role: "membre",
    redirectTo: "/membre",
  },
];

const normalize = (value) => value.trim().toLowerCase();

// "Se souvenir de moi sur cet appareil" — FACULTATIF, décoché par défaut.
// Coché, il mémorise le niveau et le matricule (le navigateur ne retient pas
// un <select>, et ça évite de tout retaper) et propose au gestionnaire de
// mots de passe du navigateur (Google Chrome...) d'enregistrer matricule +
// mot de passe (le Matricule est l'identifiant déclaré au navigateur).
// Décoché, rien n'est gardé par la
// page — et les éventuelles données mémorisées avant sont effacées.
// Le mot de passe, lui, n'est JAMAIS gardé par la page : seul le navigateur
// peut l'enregistrer, avec son propre accord (et le refuser : "Jamais").
const PREFS_STORAGE_KEY = "dbc-login-prefs-v1";

function readPrefs() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) ?? "null");
    if (raw && raw.remember === true) {
      return {
        remember: true,
        matricule: typeof raw.matricule === "string" ? raw.matricule : "",
        niveau: levels.some((level) => level.key === raw.niveau) ? raw.niveau : levels[0].key,
      };
    }
  } catch {
    // stockage indisponible ou illisible : comme si rien n'était mémorisé
  }
  return { remember: false, matricule: "", niveau: levels[0].key };
}

function writePrefs(prefs) {
  try {
    if (prefs) window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ remember: true, ...prefs }));
    else window.localStorage.removeItem(PREFS_STORAGE_KEY);
  } catch {
    // voir readPrefs
  }
}

// Comme cette page change d'écran sans recharger le site, Chrome ne voit pas
// toujours la connexion : on lui présente donc explicitement les identifiants
// (API Credential Management, Chrome/Edge ; ignorée ailleurs sans erreur).
// C'est lui qui demande ensuite l'accord de l'utilisateur.
function offerToSaveCredentials({ matricule, motDePasse }) {
  try {
    if (window.PasswordCredential && navigator.credentials?.store) {
      const credential = new window.PasswordCredential({ id: matricule, name: matricule, password: motDePasse });
      navigator.credentials.store(credential).catch(() => {});
    }
  } catch {
    // non pris en charge : le navigateur proposera l'enregistrement à sa façon
  }
}

// Champ avec icône + validation inline "moderne" : bordure et message
// rouge sous le champ dès qu'il est invalide, avec une petite animation
// d'apparition en fondu + glissement — remplace l'infobulle native du
// navigateur ("Please fill in this field"), jugée démodée, sans revenir à
// un `alert()` façon site des années 2000 non plus.
function FieldInput({ label, icon: Icon, error, trailing, ...inputProps }) {
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
            "mt-0 w-full rounded-lg border bg-white py-2.5 pl-10 text-sm text-gray-800 outline-none transition-colors duration-200 placeholder:text-gray-400",
            // Champ rempli par le navigateur : Chrome le grise/bleuit de force
            // (fond gris-bleu au remplissage automatique). On le garde blanc.
            "[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#ffffff] [&:-webkit-autofill]:[-webkit-text-fill-color:#1f2937]",
            trailing ? "pr-11" : "pr-4",
            error
              ? "border-red-400 focus:border-red-500"
              : "border-[#52A2DF]/[0.32] focus:border-[#52A2DF]",
          )}
        />
        {trailing}
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
// à droite) mais en une seule étape : Niveau, Matricule, Mot de passe. Aucun
// backend branché pour l'instant — voir TEST_ACCOUNTS plus haut — donc
// la connexion redirige vers /admin ou /membre selon le compte quand les 3
// champs correspondent, ou affiche un message d'erreur générique sinon.
// Réussie, elle ouvre une session en mémoire (voir session.js) : l'espace
// membre la vérifie (SessionGuard.jsx) et se referme après inactivité.
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // Pourquoi on arrive ici : "required" (page protégée demandée sans être
  // connecté, ex : après une actualisation), "expired" (inactivité) ou
  // "logout" (bouton Se déconnecter). Voir SessionGuard.jsx.
  const reason = location.state?.reason;
  const from = location.state?.from;
  const [lockLeft, setLockLeft] = useState(getLockRemaining);
  // Matricule et mot de passe sont des champs NON contrôlés (lus au
  // moment de l'envoi) : le gestionnaire de mots de passe du navigateur
  // (Chrome...) peut ainsi les pré-remplir tout seul sans que React
  // n'écrase la valeur. Le niveau (un <select>) est un état.
  const [prefs] = useState(readPrefs);
  const [niveau, setNiveau] = useState(prefs.niveau);
  const [remember, setRemember] = useState(prefs.remember);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking

  // Compte à rebours du blocage après trop de mauvaises tentatives.
  useEffect(() => {
    if (lockLeft <= 0) return undefined;
    const timer = window.setTimeout(() => setLockLeft(getLockRemaining()), 1000);
    return () => window.clearTimeout(timer);
  }, [lockLeft]);

  // Efface l'erreur d'un champ dès qu'on recommence à le modifier, pour un
  // retour visuel immédiat plutôt que d'attendre un nouveau submit.
  const clearError = (field) => () => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
    if (formError) setFormError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (getLockRemaining() > 0) {
      setLockLeft(getLockRemaining());
      return;
    }

    // Lu dans le formulaire lui-même (pas dans un état React) : une valeur
    // remplie par le navigateur est toujours prise en compte.
    const data = new FormData(event.currentTarget);
    const matricule = String(data.get("matricule") ?? "");
    const motDePasse = String(data.get("password") ?? "");

    const nextErrors = {};
    if (!matricule.trim()) nextErrors.matricule = "Ce champ est requis";
    if (!motDePasse) nextErrors.motDePasse = "Ce champ est requis";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("");
      return;
    }

    setStatus("checking");
    setTimeout(() => {
      const account = TEST_ACCOUNTS.find(
        (entry) =>
          entry.niveaux.includes(niveau) &&
          normalize(matricule) === normalize(entry.matricule) &&
          Boolean(entry.motDePasse) &&
          motDePasse === entry.motDePasse,
      );

      if (account) {
        recordSuccess();
        startSession({ role: account.role, name: account.nom, canSwitchRole: account.role === "admin" });
        if (remember) {
          writePrefs({ matricule: matricule.trim(), niveau });
          offerToSaveCredentials({ matricule: matricule.trim(), motDePasse });
        } else {
          writePrefs(null);
        }
        // On revient à la page demandée avant la connexion (ex : celle qui
        // était ouverte avant l'actualisation) si elle est dans l'espace du
        // compte ; sinon à l'accueil de l'espace.
        const backTo =
          account.role === "membre" && typeof from === "string" && from.startsWith("/membre")
            ? from
            : account.redirectTo;
        navigate(backTo, { replace: true });
        return;
      }

      recordFailure();
      setLockLeft(getLockRemaining());
      setStatus("idle");
      setFormError("Identifiants incorrects");
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
              Connecte-toi avec ton niveau DBC, ton matricule et ton mot de
              passe pour retrouver ton espace membre.
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
              Renseigne ton niveau DBC, ton matricule et ton mot de passe pour accéder
              à ton espace.
            </p>

            {reason && ["required", "expired", "logout"].includes(reason) && (
              <p
                role="status"
                className="mt-5 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800"
              >
                <InformationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {t(`session.notice.${reason}`)}
              </p>
            )}

            <form onSubmit={handleSubmit} method="post" noValidate className="mt-7 space-y-5">
              <FieldSelect
                label="Niveau"
                icon={TrophyIcon}
                name="niveau"
                id="login-niveau"
                autoComplete="off"
                value={niveau}
                onChange={(event) => {
                  setNiveau(event.target.value);
                  if (formError) setFormError("");
                }}
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
                name="matricule"
                id="login-matricule"
                autoComplete="username"
                defaultValue={prefs.matricule}
                spellCheck={false}
                onChange={clearError("matricule")}
                placeholder="Ex : DBC-1-0001"
                error={fieldErrors.matricule}
              />
              <FieldInput
                label="Mot de passe"
                icon={LockClosedIcon}
                type={showPassword ? "text" : "password"}
                name="password"
                id="login-password"
                autoComplete="current-password"
                onChange={clearError("motDePasse")}
                placeholder="Ton mot de passe"
                error={fieldErrors.motDePasse}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon aria-hidden="true" className="size-4" />
                    ) : (
                      <EyeIcon aria-hidden="true" className="size-4" />
                    )}
                  </button>
                }
              />

              {/* Facultatif, décoché par défaut : voir PREFS_STORAGE_KEY. */}
              <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-gray-300 accent-[#EE7115]"
                />
                <span>
                  <span className="font-semibold">Se souvenir de moi sur cet appareil</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Retient ton niveau et ton matricule, et propose à ton navigateur d&apos;enregistrer tes
                    identifiants. À éviter sur un ordinateur partagé.
                  </span>
                </span>
              </label>

              {/* Erreur générale (mauvaise combinaison) : ne précise jamais
                  lequel des 3 champs est en cause, pour rester au même
                  niveau de discrétion qu'un vrai écran de connexion. */}
              <span
                className={clsx(
                  "grid transition-all duration-200 ease-out",
                  formError || lockLeft > 0 ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <span className="overflow-hidden">
                  <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                    {lockLeft > 0 ? t("session.locked", { seconds: lockLeft }) : formError}
                  </span>
                </span>
              </span>

              <button
                type="submit"
                disabled={status === "checking" || lockLeft > 0}
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
