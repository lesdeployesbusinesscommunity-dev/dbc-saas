// Import Dependencies
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

// Bandeau de bienvenue : photo "afrique_db.jpg" en fond (déjà dans
// /public), voile sombre en dégradé pour garder le texte lisible quelle
// que soit la zone de la photo derrière, nom de l'admin injecté dans le
// message — comme sur les dashboards des sites les plus reconnus.
export function WelcomeBanner({ adminName }) {
  const { t } = useTranslation();

  return (
    <div className="relative mt-6 h-56 w-full overflow-hidden rounded-2xl sm:h-64">
      <img
        src="/afrique_db.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

      <div className="relative flex h-full flex-col justify-center px-8">
        <p className="text-2xl font-bold text-white sm:text-3xl">
          {t("admin.dashboard.welcome", { name: adminName })}
        </p>
        <p className="mt-2 text-sm italic text-white/85 sm:text-base">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>
    </div>
  );
}
