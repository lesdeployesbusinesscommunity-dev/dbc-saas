// Import Dependencies
import { useState } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  UserPlusIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { FaHandshake } from "react-icons/fa";

// Local Imports
import { useInView } from "hooks";
import { Reveal } from "components/shared/Reveal";
import { JoinDbcButton } from "components/shared/JoinDbcButton";
import { envoyerMessage } from "api/contact";

// ----------------------------------------------------------------------

// Les icônes ne peuvent pas être stockées dans les traductions : seul le
// texte ("contacts.form.reasons.<key>") en vient, résolu au rendu.
const reasons = [
  { key: "membre", Icon: UserPlusIcon },
  { key: "formation", Icon: AcademicCapIcon },
  { key: "partenariat", Icon: FaHandshake },
  { key: "autre", Icon: QuestionMarkCircleIcon },
];

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-[#52A2DF]/[0.32] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#52A2DF]";

// Formulaire de contact : POST /contact (voir api/contact.js).
export function ContactForm() {
  const { t } = useTranslation();
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [submitError, setSubmitError] = useState("");

  // "contacts.form.subjects" est une liste (returnObjects: true, même
  // convention que "simulateur.levels.<key>.advantages").
  const subjects = t("contacts.form.subjects", { returnObjects: true });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: subjects[0],
    message: "",
  });

  const updateField = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setSubmitError("");

    try {
      await envoyerMessage(form);
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setSubmitError(t(err.message));
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", subject: subjects[0], message: "" });
    setStatus("idle");
    setSubmitError("");
  };

  return (
    <section
      ref={ref}
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        {/* Formulaire */}
        <Reveal show={isInView} delay={0} className="lg:col-span-3">
          <div className="rounded-2xl border border-[#52A2DF]/[0.32] bg-white p-6 shadow-sm sm:p-8">
            {status === "sent" ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircleIcon
                  aria-hidden="true"
                  className="size-14 text-[#16A34A]"
                />
                <p className="mt-4 text-lg font-bold text-gray-900">
                  {t("contacts.form.sentTitle")}
                </p>
                <p className="mt-2 max-w-sm text-sm text-gray-600">
                  {t("contacts.form.sentText")}
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-6 rounded-lg border border-[#52A2DF] px-5 py-2 text-sm font-semibold text-[#52A2DF] transition-colors hover:bg-[#52A2DF]/[0.1]"
                >
                  {t("contacts.form.sentReset")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("contacts.form.nameLabel")}
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={updateField("name")}
                      placeholder={t("contacts.form.namePlaceholder")}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("contacts.form.emailLabel")}
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={updateField("email")}
                      placeholder={t("contacts.form.emailPlaceholder")}
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("contacts.form.phoneLabel")}{" "}
                    <span className="font-normal text-gray-400">
                      {t("contacts.form.phoneOptional")}
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={updateField("phone")}
                      placeholder={t("contacts.form.phonePlaceholder")}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t("contacts.form.subjectLabel")}
                    <select
                      value={form.subject}
                      onChange={updateField("subject")}
                      className={inputClass}
                    >
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-sm font-semibold text-gray-700">
                  {t("contacts.form.messageLabel")}
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={updateField("message")}
                    placeholder={t("contacts.form.messagePlaceholder")}
                    className={clsx(inputClass, "resize-none")}
                  />
                </label>

                {submitError && (
                  <span className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                    {submitError}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EE7115] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
                >
                  {status === "sending"
                    ? t("contacts.form.submitSending")
                    : t("contacts.form.submitIdle")}
                  <PaperAirplaneIcon aria-hidden="true" className="size-4" />
                </button>
              </form>
            )}
          </div>
        </Reveal>

        {/* Pourquoi nous écrire + rappel du bouton d'inscription */}
        <Reveal show={isInView} delay={200} className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-[#EE7115]/[0.32] bg-white p-6 sm:p-8">
            <p className="text-lg font-bold text-gray-900">
              {t("contacts.form.reasonsTitle")}
            </p>
            <ul className="mt-5 space-y-4">
              {reasons.map((reason) => (
                <li
                  key={reason.key}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]"
                  >
                    <reason.Icon className="size-4" />
                  </span>
                  {t(`contacts.form.reasons.${reason.key}`)}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-600">
                {t("contacts.form.ctaText")}
              </p>
              {/* "inline-block" est nécessaire ici : JoinDbcButton rend un
                  <a>, "inline" par défaut en CSS, sur lequel un
                  margin-top ("mt-4") n'a aucun effet — le bouton se
                  retrouvait donc collé au paragraphe juste au-dessus au
                  lieu d'en être séparé (même règle déjà appliquée dans
                  Pillars.jsx pour ce composant). */}
              <JoinDbcButton className="mt-4 inline-block" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
