// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { ComparisonTable } from "app/pages/Simulateur/ComparisonTable";
import { currentMember } from "../currentMember";
import { useMemberLevel } from "../context/MemberLevelContext";
import { TopBar } from "./TopBar";
import { WelcomeBanner } from "./WelcomeBanner";
import { ProfileSummaryCard } from "./ProfileSummaryCard";
import { StatsGrid } from "./StatsGrid";
import { RecentActivity } from "./RecentActivity";
import { MonthlyActivityChart } from "./MonthlyActivityChart";
import { RightPanel } from "./RightPanel";

// ----------------------------------------------------------------------

// Page d'accueil de l'espace membre (/membre/dashboard) : colonne
// principale (recherche, bandeau de bienvenue, carte de profil, actualité
// du mois, activités récentes, graphe du mois, tableau comparatif des
// niveaux) + panneau de droite (profil, calendrier, cotisation tontine du
// mois, formations en cours) — même structure que le dashboard admin
// (voir Admin/Dashboard/index.jsx), adaptée aux données du membre
// connecté.
//
// Le tableau comparatif est le même composant que sur la page Simulateur
// publique (voir Simulateur/ComparisonTable.jsx) plutôt qu'une copie :
// "selectedKey" met simplement en avant la ligne du niveau actuellement
// consulté (voir MemberLevelContext), sans "onSelect" — ici le
// changement de niveau se fait depuis la carte de profil, pas en
// cliquant une ligne du tableau. "myLevelKeys" ajoute la colonne
// "Solliciter" (un bouton par niveau pas encore rejoint, pour en demander
// le démarrage) — absente de la page Simulateur publique, qui n'appelle
// pas ce composant avec cette prop.
export default function MembreDashboard() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();

  return (
    <Page title={`${t("membre.nav.dashboard")} – ${currentMember.name}`}>
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1 p-6 lg:p-8">
          <TopBar />
          <WelcomeBanner />
          <ProfileSummaryCard />
          <StatsGrid />
          <RecentActivity />
          <MonthlyActivityChart />
          <div className="mt-8">
            <ComparisonTable
              levels={levels}
              selectedKey={activeLevelKey}
              myLevelKeys={currentMember.levelKeys}
            />
          </div>
        </div>

        <RightPanel />
      </div>
    </Page>
  );
}
