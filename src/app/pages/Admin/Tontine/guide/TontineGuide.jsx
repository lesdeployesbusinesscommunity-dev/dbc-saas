// Import Dependencies
import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { MapIcon } from "@heroicons/react/24/outline";

// ----------------------------------------------------------------------

const seenKey = (voice) => `dbc-guide-seen-${voice}`;
const readSeen = (voice) => {
  try {
    return window.localStorage.getItem(seenKey(voice)) === "1";
  } catch {
    return false;
  }
};

// Le lien "Guide interactif" : il ouvre la page du guide (la route sinueuse).
// "voice" : "admin" (administration, ton neutre) ou "member" (tutoiement).
// "startAt" : l'étape sur laquelle ouvrir (ex : "ledger" depuis le registre).
// Une petite pastille clignote tant que le guide n'a pas été ouvert.
export function TontineGuide({ voice = "admin", startAt, className }) {
  const { t } = useTranslation();
  const [seen, setSeen] = useState(() => readSeen(voice));
  const base = voice === "member" ? "/membre/tontine/guide" : "/admin/tontine/guide";

  const markSeen = () => {
    setSeen(true);
    try {
      window.localStorage.setItem(seenKey(voice), "1");
    } catch {
      // Sans stockage, la pastille réapparaîtra : ce n'est pas grave.
    }
  };

  return (
    <Link
      to={startAt ? `${base}?etape=${startAt}` : base}
      onClick={markSeen}
      className={
        className ??
        "relative inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-[#EE7115]"
      }
    >
      <MapIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
      {t("guideJourney.open")}
      {!seen && (
        <span aria-hidden="true" className="relative -top-1 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#EE7115]/60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2.5 rounded-full bg-[#EE7115]" />
        </span>
      )}
    </Link>
  );
}
