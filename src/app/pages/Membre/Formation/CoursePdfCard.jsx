// Import Dependencies
import { useTranslation } from "react-i18next";
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Le support de cours COMPLET d'une formation : UN PDF qui regroupe tous les
// chapitres, proposé en plus des vidéos de chaque chapitre (course.coursePdf,
// voir mockData.js). Comme tous les PDF — et contrairement aux vidéos, qui ne
// se regardent que dans la plateforme — il se TÉLÉCHARGE dans le dossier de
// téléchargements du membre, ou s'ouvre dans un nouvel onglet.
//
// Ce n'est pas une leçon : l'ouvrir ne change pas l'avancement.
//
// Le nom du fichier téléchargé est le titre du support (l'attribut
// "download" ne marche que pour un fichier de la même origine que le site —
// c'est le cas des PDF servis par la plateforme).
export function CoursePdfCard({ coursePdf }) {
  const { t } = useTranslation();
  const fileName = `${coursePdf.title.replace(/[\\/:*?"<>|]+/g, "").trim() || "formation"}.pdf`;

  return (
    <section className="mb-6 rounded-2xl border border-red-100 bg-red-50/50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600 ring-1 ring-red-100">
          <DocumentTextIcon aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900">{t("membre.formation.coursePdf.title")}</h2>
          <p className="mt-0.5 truncate text-xs font-semibold text-gray-700">{coursePdf.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{t("membre.formation.coursePdf.hint")}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={coursePdf.url}
          download={fileName}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#EE7115] px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
          {t("membre.formation.pdf.download")}
        </a>
        <a
          href={coursePdf.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4" />
          {t("membre.formation.pdf.open")}
        </a>
      </div>
    </section>
  );
}
