// Import Dependencies
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  PhoneIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { useAuthContext } from "app/contexts/auth/context";
import { REDIRECT_URL_KEY, HOME_PATH } from "constants/app.constant";
import { normalizePhoneNumber } from "utils/phone";

// ----------------------------------------------------------------------

// Champ avec icône + validation inline "moderne" : bordure et message
// rouge sous le champ dès qu'il est invalide, avec une petite animation
// d'apparition en fondu + glissement — remplace l'infobulle native du
// navigateur ("Please fill in this field"), jugée démodée.
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

// Page "Se connecter" = /login. Connexion en 2 temps : téléphone + mot de
// passe (POST /auth/login), puis code OTP WhatsApp si la double
// authentification est active sur le compte (POST /auth/verify-otp) — voir
// app/contexts/auth/Provider.jsx pour l'orchestration réelle.
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login,
    verifyOtp,
    resetLogin,
    isAuthenticated,
    isLoading,
    errorMessage,
    otpRequired,
  } = useAuthContext();

  const [credentials, setCredentials] = useState({ phoneNumber: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate(searchParams.get(REDIRECT_URL_KEY) || HOME_PATH, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const updateCredential = (field) => (event) => {
    const { value } = event.target;
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  };

  const handleSubmitCredentials = (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!credentials.phoneNumber.trim()) nextErrors.phoneNumber = "Ce champ est requis";
    if (!credentials.password.trim()) nextErrors.password = "Ce champ est requis";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    login({
      phoneNumber: normalizePhoneNumber(credentials.phoneNumber),
      password: credentials.password,
    });
  };

  const handleSubmitOtp = (event) => {
    event.preventDefault();
    if (!otpCode.trim()) {
      setFieldErrors({ otpCode: "Ce champ est requis" });
      return;
    }
    verifyOtp(otpCode);
  };

  const handleBackToCredentials = () => {
    setOtpCode("");
    setFieldErrors({});
    resetLogin();
  };

  const generalError = errorMessage ? t(errorMessage.message) : "";

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
              Connecte-toi avec ton numéro de téléphone et ton mot de passe
              pour retrouver ton espace membre.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="relative flex flex-col items-center justify-center bg-white px-4 py-14 sm:px-6 lg:px-12">
          <button
            type="button"
            onClick={() => (otpRequired ? handleBackToCredentials() : navigate(-1))}
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

            {!otpRequired ? (
              <>
                <p className="text-2xl font-extrabold text-gray-900">
                  Content de te <span className="text-[#EE7115]">revoir</span>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Renseigne ton numéro de téléphone et ton mot de passe pour
                  accéder à ton espace.
                </p>

                <form onSubmit={handleSubmitCredentials} noValidate className="mt-7 space-y-5">
                  <FieldInput
                    label="Numéro de téléphone"
                    icon={PhoneIcon}
                    type="tel"
                    autoComplete="tel"
                    value={credentials.phoneNumber}
                    onChange={updateCredential("phoneNumber")}
                    placeholder="Ex : +237600000000"
                    error={fieldErrors.phoneNumber}
                  />
                  <FieldInput
                    label="Mot de passe"
                    icon={LockClosedIcon}
                    type="password"
                    autoComplete="current-password"
                    value={credentials.password}
                    onChange={updateCredential("password")}
                    placeholder="Ton mot de passe"
                    error={fieldErrors.password}
                  />

                  <span
                    className={clsx(
                      "grid transition-all duration-200 ease-out",
                      generalError ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="overflow-hidden">
                      <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                        {generalError}
                      </span>
                    </span>
                  </span>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <>
                        Se connecter
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-gray-900">
                  Code de <span className="text-[#EE7115]">vérification</span>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Un code vient de t&apos;être envoyé par WhatsApp. Renseigne-le
                  ci-dessous pour terminer la connexion.
                </p>

                <form onSubmit={handleSubmitOtp} noValidate className="mt-7 space-y-5">
                  <FieldInput
                    label="Code reçu par WhatsApp"
                    icon={ShieldCheckIcon}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(event) => {
                      setOtpCode(event.target.value);
                      setFieldErrors({});
                    }}
                    placeholder="Ex : 123456"
                    error={fieldErrors.otpCode}
                  />

                  <span
                    className={clsx(
                      "grid transition-all duration-200 ease-out",
                      generalError ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="overflow-hidden">
                      <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                        {generalError}
                      </span>
                    </span>
                  </span>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <ArrowPathIcon aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <>
                        Valider le code
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

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
