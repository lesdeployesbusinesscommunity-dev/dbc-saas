// Import Dependencies
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UserPlusIcon,
  IdentificationIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { currentMember } from "../currentMember";
import { whatsappLink } from "./contactLinks";

// ----------------------------------------------------------------------

// "Parrainer quelqu'un" : l'action naturelle de cette page. Ce que la
// personne parrainée utilise, c'est le MATRICULE du parrain (voir
// currentMember.js : "matricule" — le même champ "Parrain (matricule)" que
// côté admin, Admin/Membres/AddMemberModal.jsx) : il est donc mis en avant
// et se copie en un clic. Le lien d'inscription (qui contient ce matricule)
// et le partage WhatsApp, message déjà écrit, restent là pour aller plus
// vite. Le lien pointe vers la vraie page d'inscription (/inscription, voir
// Inscription/index.jsx) qui lit "?ref=" et pré-remplit "Matricule du
// parrain". Les champs restent
// sélectionnables pour qu'on puisse toujours copier à la main si le
// presse-papiers du navigateur est bloqué.
export function InviteCard() {
  const { t } = useTranslation();
  // "copied" : ce qui vient d'être copié ("matricule", "link") ou null.
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);
  const matriculeRef = useRef(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/inscription?ref=${currentMember.matricule}`;

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (what, text, fallbackRef) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      fallbackRef.current?.select();
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <UserPlusIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
            {t("membre.reseau.invite.title")}
          </h2>
          <p className="mt-1 text-xs text-gray-500">{t("membre.reseau.invite.subtitle")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#52A2DF]/[0.08] p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#52A2DF] shadow-sm">
            <IdentificationIcon className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-gray-500">{t("membre.reseau.invite.matriculeLabel")}</p>
            <input
              ref={matriculeRef}
              readOnly
              value={currentMember.matricule}
              aria-label={t("membre.reseau.invite.matriculeLabel")}
              onFocus={(event) => event.target.select()}
              className="w-40 bg-transparent text-lg font-bold tracking-wide text-gray-900 outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => copy("matricule", currentMember.matricule, matriculeRef)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#2f78b4] shadow-sm transition-opacity hover:opacity-90"
        >
          {copied === "matricule" ? (
            <CheckIcon aria-hidden="true" className="size-4" />
          ) : (
            <ClipboardDocumentIcon aria-hidden="true" className="size-4" />
          )}
          {copied === "matricule" ? t("membre.reseau.invite.copiedMatricule") : t("membre.reseau.invite.copyMatricule")}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          readOnly
          value={link}
          aria-label={t("membre.reseau.invite.linkLabel")}
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#52A2DF]"
        />
        <button
          type="button"
          onClick={() => copy("link", link, inputRef)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#52A2DF] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {copied === "link" ? (
            <CheckIcon aria-hidden="true" className="size-4" />
          ) : (
            <ClipboardDocumentIcon aria-hidden="true" className="size-4" />
          )}
          {copied === "link" ? t("membre.reseau.invite.copied") : t("membre.reseau.invite.copy")}
        </button>
        <a
          href={whatsappLink(null, t("membre.reseau.invite.message", { link, matricule: currentMember.matricule }))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#52A2DF] px-4 py-2 text-sm font-semibold text-[#2f78b4] transition-colors hover:bg-[#52A2DF]/[0.08]"
        >
          <ChatBubbleLeftRightIcon aria-hidden="true" className="size-4" />
          {t("membre.reseau.invite.whatsapp")}
        </a>
      </div>
    </div>
  );
}
