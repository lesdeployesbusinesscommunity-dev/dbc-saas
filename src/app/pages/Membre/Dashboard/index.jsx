// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { levels } from "app/pages/Simulateur/data";
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { ComparisonTable } from "app/pages/Simulateur/ComparisonTable";
import { currentMember } from "../currentMember";
import { useMemberLevel } from "../context/MemberLevelContext";
import { SearchEmpty } from "../components/SearchEmpty";
import { useReportMatches, useSearchSummary } from "../components/searchSummary";
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
//
// Recherche de l'en-tête : elle filtre les listes du Dashboard — activités
// récentes, niveaux du tableau comparatif, et dans le panneau de droite le
// groupe de tontine et les formations en cours (voir RightPanel). Les
// blocs qui ne sont pas des listes (bandeau, carte de profil, chiffres du
// mois, graphe) ne bougent pas. Une liste sans correspondance disparaît ; si
// aucune n'en a, un message le dit sous l'en-tête (voir
// components/searchSummary.js).
export default function MembreDashboard() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();
  const [query, setQuery] = useState("");
  const matchingLevels = levels.filter((level) =>
    searchTextIncludes(t(`simulateur.levels.${level.key}.name`), query),
  );
  const { report, noResults } = useSearchSummary(query);
  useReportMatches(report, "levels", matchingLevels.length);

  return (
    <Page title={`${t("membre.nav.dashboard")} – ${currentMember.name}`}>
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1 p-6 lg:p-8">
          <TopBar
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder={t("membre.dashboard.searchPlaceholder")}
          />
          {noResults && <SearchEmpty query={query} className="mt-6" />}
          <WelcomeBanner />
          <ProfileSummaryCard />
          <StatsGrid />
          <RecentActivity query={query} onMatches={report} />
          <MonthlyActivityChart />
          <div className="mt-8">
            {matchingLevels.length > 0 && (
              <ComparisonTable
                levels={matchingLevels}
                selectedKey={activeLevelKey}
                myLevelKeys={currentMember.levelKeys}
              />
            )}
          </div>
        </div>

        <RightPanel query={query} onMatches={report} />
      </div>
    </Page>
  );
}
