// Import Dependencies
import { useTranslation } from "react-i18next";
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------

// Un support PDF d'une formation. Contrairement aux vidéos (qui ne se
// regardent que dans la plateforme, voir VideoPlayer.jsx), un PDF se
// TÉLÉCHARGE : le bouton l'enregistre dans le dossier de téléchargements du
// membre, et il peut aussi s'ouvrir dans un nouvel onglet. L'aperçu intégré
// permet de le lire sans quitter la page. Télécharger ou ouvrir le document
// le compte comme lu ("onOpened", voir progressStore.js).
//
// Le nom du fichier téléchargé est le titre du support (l'attribut
// "download" ne marche que pour un fichier de la même origine que le site —
// c'est le cas des PDF servis par la plateforme).
export function PdfViewer({ lesson, onOpened }) {
  const { t } = useTranslation();
  const fileName = `${lesson.title.replace(/[\\/:*?"<>|]+/g, "").trim() || "document"}.pdf`;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <DocumentTextIcon aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{lesson.title}</p>
          <p className="text-xs text-gray-500">{t("membre.formation.pdf.hint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={lesson.url}
            download={fileName}
            onClick={onOpened}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#EE7115] px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ArrowDownTrayIcon aria-hidden="true" className="size-4" />
            {t("membre.formation.pdf.download")}
          </a>
          <a
            href={lesson.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpened}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4" />
            {t("membre.formation.pdf.open")}
          </a>
        </div>
      </div>

      <iframe
        title={lesson.title}
        src={`${lesson.url}#view=FitH`}
        className="h-[70vh] min-h-[28rem] w-full bg-gray-100"
      />
    </div>
  );
}
