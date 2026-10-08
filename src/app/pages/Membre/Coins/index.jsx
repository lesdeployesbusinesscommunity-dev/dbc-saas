// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { SearchEmpty } from "../components/SearchEmpty";
import { useSearchSummary } from "../components/searchSummary";
import { CoinsHero } from "./CoinsHero";
import { CoinsProgress } from "./CoinsProgress";
import { CoinsLeaderboard } from "./CoinsLeaderboard";
import { EarnCoinsTable } from "./EarnCoinsTable";
import { CoinsRewards } from "./CoinsRewards";
import { CoinsChart } from "./CoinsChart";
import { CoinsHistory } from "./CoinsHistory";

// ----------------------------------------------------------------------

// Page "DBC Coins" (/membre/coins) : on avance page par page, section par
// section (même principe que Tontine/index.jsx et Mlm/index.jsx) — la
// bannière "Mes DBC Coins" (CoinsHero.jsx), le prochain objectif
// (CoinsProgress.jsx), où on se situe dans la communauté
// (CoinsLeaderboard.jsx), comment gagner des Coins (EarnCoinsTable.jsx) et
// comment les utiliser (CoinsRewards.jsx), puis l'évolution mois par mois
// (CoinsChart.jsx) juste au-dessus de l'historique détaillé
// (CoinsHistory.jsx) dont elle est tirée.
//
// La recherche de l'en-tête filtre les listes de la page : un membre du
// classement (par nom), une façon de gagner des Coins, une récompense, ou
// une ligne de l'historique. Le solde, l'objectif et le graphique ne
// bougent pas. Une liste sans correspondance disparaît ; un seul message
// s'affiche sous l'en-tête quand plus aucune ne correspond.
export default function MembreCoins() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { report, noResults } = useSearchSummary(query);

  return (
    <Page title={`${t("membre.nav.coins")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar
          titleKey="membre.nav.coins"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("membre.coins.searchPlaceholder")}
        />
        {noResults && <SearchEmpty query={query} className="mt-6" />}
        <CoinsHero />
        <CoinsProgress />
        <CoinsLeaderboard query={query} onMatches={report} />
        <EarnCoinsTable query={query} onMatches={report} />
        <CoinsRewards query={query} onMatches={report} />
        <CoinsChart />
        <CoinsHistory query={query} onMatches={report} />
      </div>
    </Page>
  );
}
