// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
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
export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <Page title={`Admin – ${t("admin.dashboard.title")}`}>
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1 p-6 lg:p-8">
          <TopBar />
          <WelcomeBanner adminName={currentAdmin.name} />
          <StatsGrid />
          <CagnottesChart />
        </div>

        <RightPanel />
      </div>
    </Page>
  );
}
