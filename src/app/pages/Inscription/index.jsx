// Import Dependencies
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  GlobeAltIcon,
  MapPinIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { levels, formatMoney } from "app/pages/Simulateur/data";
import { addRegistration } from "app/pages/Admin/Inscriptions/registrationsStore";
import {
  PROOF_ACCEPT,
  PROOF_MAX_IMAGE_MB,
  PROOF_MAX_PDF_MB,
  formatFileSize,
  isImageProof,
  prepareProof,
} from "app/pages/Admin/Inscriptions/proofUtils";

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

// Champs obligatoires par étape ("pays" et "tontine" ont toujours une
// valeur par défaut — voir le state "form" — donc jamais vides).
const REQUIRED_FIELDS_BY_STEP = {
  1: ["nom", "prenom", "email", "dateNaissance"],
  2: ["cni", "ville", "whatsapp"],
  3: ["travail"],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Matricule du parrain venu du lien de parrainage (/inscription?ref=
// DBC-1-0042 — lien copié depuis "Mon Réseau", voir Membre/Reseau/
// InviteCard.jsx). Le paramètre vient de l'adresse, donc on ne garde que
// lettres, chiffres et tirets (jamais de contenu arbitraire dans le
// formulaire) et on le met en majuscules comme les matricules admin.
function sponsorFromLink(searchParams) {
  return (searchParams.get("ref") ?? "")
    .replace(/[^A-Za-z0-9-]/g, "")
    .slice(0, 32)
    .toUpperCase();
}

// Champ texte/email/date/tel avec icône intégrée, même style visuel que
// le reste du site (bordure bleue à 32%, focus bleu plein). "error" :
// bordure rouge + message qui apparaît en fondu sous le champ — remplace
// l'infobulle native du navigateur ("Please fill in this field"), jugée
// démodée (voir goNext/handleSubmit plus bas, "noValidate" sur le <form>
// désactive cette infobulle et cette logique manuelle prend le relais).
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

// Même principe pour un <select> (Pays, Choix de tontine) — ces deux
// champs ont toujours une valeur par défaut (countries[0] / levels[0]),
// donc pas de message "requis" possible pour eux, mais "error" reste
// disponible pour rester cohérent visuellement si besoin plus tard.
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

// Le justificatif d'activité : un document qui prouve que la personne exerce
// bien le métier qu'elle vient d'indiquer. On clique (ou on glisse un fichier) ;
// une photo ou un scan est réduit dans le navigateur, un PDF est gardé tel quel
// (voir Admin/Inscriptions/proofUtils.js). Une fois choisi, le fichier s'affiche
// avec son nom et son poids, et peut être changé ou retiré. "error" : même
// présentation que les autres champs du formulaire.
function ProofUpload({ proof, onChange, error }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState("");

  const choose = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    setProblem("");
    try {
      onChange(await prepareProof(file));
    } catch (failure) {
      if (failure?.code === "type") setProblem("Ce fichier n'est pas accepté : choisis un PDF, une photo JPG, PNG ou WebP.");
      else if (failure?.code === "size")
        setProblem(
          file.type === "application/pdf"
            ? `Ce PDF dépasse ${String(PROOF_MAX_PDF_MB).replace(".", ",")} Mo. Réduis-le ou envoie plutôt une photo.`
            : `Cette image dépasse ${PROOF_MAX_IMAGE_MB} Mo.`,
        );
      else setProblem("Ce fichier n'a pas pu être lu. Essaie avec un autre fichier.");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const shownError = problem || error;
  const Icon = isImageProof(proof) ? PhotoIcon : DocumentTextIcon;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700">Justificatif de ton activité</p>
      <p className="mt-0.5 text-xs text-gray-500">
        Un document qui prouve que tu exerces bien ce métier : attestation de travail, carte professionnelle, registre
        de commerce, patente, bulletin de salaire ou facture récente.
      </p>

      {proof ? (
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#52A2DF]/[0.32] bg-[#52A2DF]/[0.05] p-3">
          {isImageProof(proof) ? (
            <img src={proof.dataUrl} alt="" className="size-12 shrink-0 rounded-md object-cover ring-1 ring-black/5" />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white text-[#EE7115] ring-1 ring-black/5">
              <Icon aria-hidden="true" className="size-6" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{proof.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(proof.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Retirer le justificatif"
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
          >
            <XMarkIcon aria-hidden="true" className="size-5" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            choose(event.dataTransfer.files);
          }}
          className={clsx(
            "relative mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors",
            dragging
              ? "border-[#52A2DF] bg-[#52A2DF]/[0.08]"
              : shownError
                ? "border-red-400 bg-red-50/40"
                : "border-[#52A2DF]/[0.4] hover:bg-[#52A2DF]/[0.05]",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={PROOF_ACCEPT}
            disabled={busy}
            onChange={(event) => choose(event.target.files)}
            className="sr-only"
          />
          <ArrowUpTrayIcon aria-hidden="true" className={clsx("size-6", shownError ? "text-red-500" : "text-[#52A2DF]")} />
          <span className="text-sm font-semibold text-gray-800">
            {busy ? "Préparation du fichier..." : "Importer un justificatif"}
          </span>
          <span className="text-xs text-gray-400">
            PDF, JPG, PNG ou WebP · PDF de {String(PROOF_MAX_PDF_MB).replace(".", ",")} Mo maximum
          </span>
        </label>
      )}

      <span
        role={shownError ? "alert" : undefined}
        className={clsx(
          "grid text-xs font-medium text-red-600 transition-all duration-200 ease-out",
          shownError ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <span className="flex items-center gap-1 overflow-hidden">
          <ExclamationCircleIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {shownError}
        </span>
      </span>
    </div>
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
  const [searchParams] = useSearchParams();
  // "Matricule du parrain" pré-rempli quand la personne arrive par le
  // lien de son parrain ; le champ reste modifiable (lien tronqué, erreur
  // de copie...). Vide si on arrive sur /inscription sans lien.
  const [sponsorFromRef] = useState(() => sponsorFromLink(searchParams));
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [showSent, setShowSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    dateNaissance: "",
    cni: "",
    pays: countries[0],
    ville: "",
    whatsapp: "",
    tontine: levels[0].key,
    travail: "",
    justificatif: null,
    parrain: sponsorFromRef,
  });

  const updateField = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    // Efface l'erreur du champ dès qu'on recommence à le modifier, pour un
    // retour visuel immédiat plutôt que d'attendre le prochain "Suivant".
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  };

  // Valide les champs obligatoires de l'étape donnée ; renvoie les erreurs
  // trouvées ({} si tout est valide) sans jamais utiliser l'infobulle
  // native du navigateur (reportValidity()).
  const validateStep = (step) => {
    const errors = {};
    for (const field of REQUIRED_FIELDS_BY_STEP[step]) {
      if (!form[field].trim()) {
        errors[field] = "Ce champ est requis";
      }
    }
    if (step === 3 && !form.justificatif) {
      errors.justificatif = "Ajoute un document qui prouve ton activité";
    }
    if (step === 1 && form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = "Adresse email invalide";
    }
    return errors;
  };

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
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setCurrentStep((step) => Math.min(step + 1, STEP_COUNT));
  };

  const goBack = () => {
    setFieldErrors({});
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    // La demande arrive dans "Demandes d'inscription" côté admin (registre
    // local en attendant l'endpoint d'inscription du backend). Elle n'est pas
    // enregistrée si le navigateur n'a plus la place de garder le justificatif.
    if (!addRegistration(form)) {
      setFieldErrors({
        justificatif: "Ce fichier est trop lourd pour être enregistré ici. Choisis une photo ou un PDF plus léger.",
      });
      return;
    }
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

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {currentStep === 1 && (
                    <>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <FieldInput
                          label="Nom"
                          icon={UserIcon}
                          type="text"
                          value={form.nom}
                          onChange={updateField("nom")}
                          placeholder="Ton nom"
                          error={fieldErrors.nom}
                        />
                        <FieldInput
                          label="Prénom"
                          icon={UserIcon}
                          type="text"
                          value={form.prenom}
                          onChange={updateField("prenom")}
                          placeholder="Ton prénom"
                          error={fieldErrors.prenom}
                        />
                      </div>
                      <FieldInput
                        label="Email"
                        icon={EnvelopeIcon}
                        type="email"
                        value={form.email}
                        onChange={updateField("email")}
                        placeholder="ton@email.com"
                        error={fieldErrors.email}
                      />
                      <FieldInput
                        label="Date de naissance"
                        icon={CalendarDaysIcon}
                        type="date"
                        value={form.dateNaissance}
                        onChange={updateField("dateNaissance")}
                        error={fieldErrors.dateNaissance}
                      />
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <FieldInput
                        label="Numéro CNI"
                        icon={IdentificationIcon}
                        type="text"
                        value={form.cni}
                        onChange={updateField("cni")}
                        placeholder="Numéro de ta carte d'identité"
                        error={fieldErrors.cni}
                      />
                      <FieldSelect
                        label="Pays"
                        icon={GlobeAltIcon}
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
                        label="Ville"
                        icon={MapPinIcon}
                        type="text"
                        value={form.ville}
                        onChange={updateField("ville")}
                        placeholder="Ta ville de résidence"
                        error={fieldErrors.ville}
                      />
                      <FieldInput
                        label="Numéro WhatsApp"
                        icon={DevicePhoneMobileIcon}
                        type="tel"
                        value={form.whatsapp}
                        onChange={updateField("whatsapp")}
                        placeholder="+225 ..."
                        error={fieldErrors.whatsapp}
                      />
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <FieldSelect
                        label="Choix de tontine"
                        icon={BanknotesIcon}
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
                        value={form.travail}
                        onChange={updateField("travail")}
                        placeholder="Ton activité actuelle"
                        error={fieldErrors.travail}
                      />
                      <ProofUpload
                        proof={form.justificatif}
                        onChange={(justificatif) => {
                          setForm((prev) => ({ ...prev, justificatif }));
                          setFieldErrors((prev) => (prev.justificatif ? { ...prev, justificatif: null } : prev));
                        }}
                        error={fieldErrors.justificatif}
                      />
                      <FieldInput
                        label="Matricule du parrain (facultatif)"
                        icon={UserGroupIcon}
                        type="text"
                        value={form.parrain}
                        onChange={updateField("parrain")}
                        placeholder="Ex : DBC-1-0001"
                        error={fieldErrors.parrain}
                      />
                      {!form.parrain.trim() && (
                        <p className="-mt-2 text-xs text-gray-500">
                          Pas de parrain ? Aucun souci : l&apos;administration DBC sera ton parrain.
                        </p>
                      )}
                      {sponsorFromRef && form.parrain === sponsorFromRef && (
                        <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-green-700">
                          <CheckCircleIcon aria-hidden="true" className="size-3.5 shrink-0" />
                          Pré-rempli grâce au lien de ton parrain.
                        </p>
                      )}
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
