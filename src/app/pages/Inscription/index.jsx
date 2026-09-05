// Import Dependencies
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels, formatMoney } from "app/pages/Simulateur/data";

// ----------------------------------------------------------------------

// Pays proposés au choix (zone d'implantation actuelle/cible de la DBC +
// diaspora) — liste simple à étendre plus tard si besoin.
const countries = [
  "Cameroun",
  "Côte d'Ivoire",
  "Sénégal",
  "Mali",
  "Gabon",
  "Congo",
  "RD Congo",
  "Bénin",
  "Togo",
  "Burkina Faso",
  "Guinée",
  "Tchad",
  "Niger",
  "Maroc",
  "Tunisie",
  "Algérie",
  "France",
  "Belgique",
  "Canada",
  "États-Unis",
  "Autre",
];

// Les 3 étapes du formulaire, avec leurs champs.
const STEP_COUNT = 3;

// Champ texte/email/date/tel avec icône intégrée, même style visuel que
// le reste du site (bordure bleue à 32%, focus bleu plein).
function FieldInput({ label, icon: Icon, ...inputProps }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <div className="relative mt-1.5">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#52A2DF]"
        />
        <input
          {...inputProps}
          className="mt-0 w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#52A2DF]"
        />
      </div>
    </label>
  );
}

// Même principe pour un <select> (Pays, Choix de tontine).
function FieldSelect({ label, icon: Icon, children, ...selectProps }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <div className="relative mt-1.5">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#52A2DF]"
        />
        <select
          {...selectProps}
          className="mt-0 w-full appearance-none rounded-lg border border-[#52A2DF]/[0.32] bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors focus:border-[#52A2DF]"
        >
          {children}
        </select>
      </div>
    </label>
  );
}

// Schéma 1 → 2 → 3 en haut du formulaire : un cercle par étape, relié par
// un trait qui se colore au fur et à mesure que les étapes sont validées.
// L'étape déjà passée affiche une coche plutôt que son numéro.
function Stepper({ currentStep }) {
  return (
    <div className="mb-7 flex items-center">
      {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex flex-1 items-center last:flex-none">
          <div
            className={clsx(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300",
              step < currentStep && "bg-[#EE7115] text-white",
              step === currentStep && "bg-[#EE7115] text-white ring-4 ring-[#EE7115]/[0.2]",
              step > currentStep && "border-2 border-gray-200 text-gray-400",
            )}
          >
            {step < currentStep ? (
              <CheckIcon aria-hidden="true" className="size-4" />
            ) : (
              step
            )}
          </div>
          {step < STEP_COUNT && (
            <div
              className={clsx(
                "mx-2 h-1 flex-1 rounded-full transition-colors duration-300",
                step < currentStep ? "bg-[#EE7115]" : "bg-gray-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Page "Rejoindre la DBC" = /inscription (bouton JoinDbcButton, présent sur
// tout le site public). Écran plein, en dehors de PublicLayout (pas de
// header/footer) — comme une page de connexion classique — avec un
// panneau décoratif "Afrique" à gauche (l'image du hero de l'accueil,
// bien visible cette fois, au milieu de l'espace libre du panneau) et le
// formulaire d'inscription à droite, en 3 étapes.
//
// Simule l'envoi côté client pour l'instant (pas d'API branchée) — à
// remplacer par un vrai appel à l'endpoint d'inscription (NestJS) plus
// tard : "status" passerait alors par "sending" pendant l'appel réseau
// réel plutôt qu'un simple setTimeout.
export default function Inscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [showSent, setShowSent] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    dateNaissance: "",
    cni: "",
    pays: countries[0],
    whatsapp: "",
    tontine: levels[0].key,
    travail: "",
    parrain: "",
  });

  const updateField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  // La coche "s'anime" avec un léger décalage après le passage à "sent",
  // pour qu'elle apparaisse avec un fondu + zoom plutôt que d'un coup.
  useEffect(() => {
    if (status === "sent") {
      const timeout = setTimeout(() => setShowSent(true), 20);
      return () => clearTimeout(timeout);
    }
    setShowSent(false);
    return undefined;
  }, [status]);

  const goNext = () => {
    // reportValidity() ne vérifie que les champs présents dans le DOM :
    // comme seule l'étape active est montée, ça valide juste ses champs.
    if (formRef.current && !formRef.current.reportValidity()) return;
    setCurrentStep((step) => Math.min(step + 1, STEP_COUNT));
  };

  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 1));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (formRef.current && !formRef.current.reportValidity()) return;
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 1400);
  };

  return (
    <Page title="Rejoindre la DBC">
      <main className="grid min-h-100vh grid-cols-1 bg-white lg:grid-cols-2">
        {/* Panneau décoratif : touche africaine, caché sur mobile pour
            laisser toute la place au formulaire. */}
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

          {/* L'image Afrique du hero de l'accueil, bien visible cette
              fois (pas un filigrane) : elle occupe l'espace qui restait
              vide au milieu du panneau. Le halo flou derrière lui donne
              un peu de profondeur sans surcharger. */}
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
              Rejoins le premier <span className="text-[white]">écosystème</span>{" "}
              business panafricain
            </p>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              Financement, formation, réseau et investissement : tout ce dont
              tu as besoin pour construire ton business, au sein d&apos;une
              communauté qui avance ensemble.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="relative flex flex-col items-center justify-center bg-white px-4 py-14 sm:px-6 lg:px-12">
          {/* Flèche retour : revient à la page précédente (pas
              forcément l'accueil), là où la personne se trouvait avant
              de cliquer sur "Rejoins la DBC". */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 sm:left-6 lg:left-8 lg:top-8"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-5" />
          </button>

          <div className="w-full max-w-md">
            {/* Logo affiché seulement sur mobile (le panneau de gauche le
                porte déjà sur grand écran). */}
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

            {status !== "idle" ? (
              <div
                className={clsx(
                  "flex flex-col items-center py-10 text-center transition-all duration-500 ease-out",
                  status === "sending" && "opacity-100",
                  status === "sent" &&
                    (showSent ? "scale-100 opacity-100" : "scale-90 opacity-0"),
                )}
              >
                {status === "sending" ? (
                  <>
                    <ArrowPathIcon
                      aria-hidden="true"
                      className="size-14 animate-spin text-[#52A2DF]"
                    />
                    <p className="mt-4 text-sm font-semibold text-gray-600">
                      Envoi de ton inscription...
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon
                      aria-hidden="true"
                      className="size-14 text-[#16A34A]"
                    />
                    <p className="mt-4 text-xl font-extrabold text-gray-900">
                      Bienvenue dans la DBC !
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Nous avons bien reçu ta demande, nous te recontacterons
                      très prochainement pour finaliser ton inscription.
                    </p>
                    <Link
                      to="/accueil"
                      className="mt-6 inline-block rounded-lg border border-[#52A2DF] px-5 py-2 text-sm font-semibold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.1]"
                    >
                      Retour à l&apos;accueil
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-gray-900">
                  Rejoins <span className="text-[#EE7115]">la DBC</span>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Renseigne tes informations en 3 étapes pour finaliser ton
                  inscription.
                </p>

                <div className="mt-7">
                  <Stepper currentStep={currentStep} />
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                  {currentStep === 1 && (
                    <>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <FieldInput
                          label="Nom"
                          icon={UserIcon}
                          type="text"
                          required
                          value={form.nom}
                          onChange={updateField("nom")}
                          placeholder="Ton nom"
                        />
                        <FieldInput
                          label="Prénom"
                          icon={UserIcon}
                          type="text"
                          required
                          value={form.prenom}
                          onChange={updateField("prenom")}
                          placeholder="Ton prénom"
                        />
                      </div>
                      <FieldInput
                        label="Email"
                        icon={EnvelopeIcon}
                        type="email"
                        required
                        value={form.email}
                        onChange={updateField("email")}
                        placeholder="ton@email.com"
                      />
                      <FieldInput
                        label="Date de naissance"
                        icon={CalendarDaysIcon}
                        type="date"
                        required
                        value={form.dateNaissance}
                        onChange={updateField("dateNaissance")}
                      />
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <FieldInput
                        label="Numéro CNI"
                        icon={IdentificationIcon}
                        type="text"
                        required
                        value={form.cni}
                        onChange={updateField("cni")}
                        placeholder="Numéro de ta carte d'identité"
                      />
                      <FieldSelect
                        label="Pays"
                        icon={GlobeAltIcon}
                        required
                        value={form.pays}
                        onChange={updateField("pays")}
                      >
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </FieldSelect>
                      <FieldInput
                        label="Numéro WhatsApp"
                        icon={DevicePhoneMobileIcon}
                        type="tel"
                        required
                        value={form.whatsapp}
                        onChange={updateField("whatsapp")}
                        placeholder="+225 ..."
                      />
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <FieldSelect
                        label="Choix de tontine"
                        icon={BanknotesIcon}
                        required
                        value={form.tontine}
                        onChange={updateField("tontine")}
                      >
                        {levels.map((level) => (
                          <option key={level.key} value={level.key}>
                            {t(`simulateur.levels.${level.key}.name`)} —{" "}
                            {formatMoney(level.cotisation)}
                            {t("simulateur.perMonth")}
                          </option>
                        ))}
                      </FieldSelect>
                      <FieldInput
                        label="Travail / Profession"
                        icon={BriefcaseIcon}
                        type="text"
                        required
                        value={form.travail}
                        onChange={updateField("travail")}
                        placeholder="Ton activité actuelle"
                      />
                      <FieldInput
                        label="Matricule du parrain"
                        icon={UserGroupIcon}
                        type="text"
                        required
                        value={form.parrain}
                        onChange={updateField("parrain")}
                        placeholder="Ex : DBC-00123"
                      />
                    </>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={goBack}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <ArrowLeftIcon aria-hidden="true" className="size-4" />
                        Précédent
                      </button>
                    )}

                    {currentStep < STEP_COUNT ? (
                      <button
                        type="button"
                        onClick={goNext}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Suivant
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Rejoindre la DBC
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                      </button>
                    )}
                  </div>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  Tu as déjà un compte ?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#52A2DF] hover:underline"
                  >
                    Se connecter
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </Page>
  );
}
