// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
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
export default function MembreCoins() {
  const { t } = useTranslation();

  return (
    <Page title={`${t("membre.nav.coins")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar titleKey="membre.nav.coins" />
        <CoinsHero />
        <CoinsProgress />
        <CoinsLeaderboard />
        <EarnCoinsTable />
        <CoinsRewards />
        <CoinsChart />
        <CoinsHistory />
      </div>
    </Page>
  );
}
