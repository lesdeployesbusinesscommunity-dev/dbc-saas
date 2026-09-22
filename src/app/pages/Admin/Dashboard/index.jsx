// Import Dependencies
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { tableauDeBord } from "api/gouvernance";
import { currentAdmin } from "./mockData";
import { TopBar } from "./TopBar";
import { WelcomeBanner } from "./WelcomeBanner";
import { StatsGrid } from "./StatsGrid";
import { CagnottesChart } from "./CagnottesChart";
import { RightPanel } from "./RightPanel";

// ----------------------------------------------------------------------

// Page d'accueil de l'espace admin (/admin/dashboard) : colonne principale
// (recherche, bandeau de bienvenue, vue globale, graphe des cagnottes) +
// panneau de droite (profil, calendrier, bénéficiaires tontine, formations).
// "Vue globale" (StatsGrid) vient de GET /gouvernance/tableau-de-bord — le
// reste du panneau de droite (bénéficiaires tontine, formations en cours)
// reste en mockData.js : pas d'agrégat réel équivalent côté backend pour
// l'instant.
export default function AdminDashboard() {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    tableauDeBord()
      .then((data) => {
        if (!cancelled) {
          setDashboardData(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Page title={`Admin – ${t("admin.dashboard.title")}`}>
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1 p-6 lg:p-8">
          <TopBar />
          <WelcomeBanner adminName={currentAdmin.name} />

          {status === "loading" && (
            <div className="mt-8 flex items-center justify-center text-gray-400">
              <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
            </div>
          )}

          {status === "error" && (
            <div className="mt-8 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              Impossible de charger les statistiques pour le moment.
            </div>
          )}

          {status === "ready" && <StatsGrid data={dashboardData} />}

          <CagnottesChart />
        </div>

        <RightPanel />
      </div>
    </Page>
  );
}
