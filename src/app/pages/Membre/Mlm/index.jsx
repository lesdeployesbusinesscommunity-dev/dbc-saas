// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { SearchEmpty } from "../components/SearchEmpty";
import { useSearchSummary } from "../components/searchSummary";
import { useMemberLevel } from "../context/MemberLevelContext";
import { MlmOverview } from "./MlmOverview";
import { PacksLadder } from "./PacksLadder";
import { MyNetwork } from "./MyNetwork";
import { MlmIneligible } from "./MlmIneligible";
import { getLongrichPacks } from "./mockData";

// ----------------------------------------------------------------------

// Page "Mon MLM" (/membre/mlm) : le partenariat Longrich, distinct du
// système de tontine (voir Tontine/index.jsx) mais accessible seulement à
// partir d'un certain niveau DBC — pas à tous les niveaux du membre (voir
// currentMember.js : "levelKeys", maintenant 3 niveaux). L'éligibilité se
// lit directement dans "getLongrichPacks" (voir mockData.js) : un niveau
// est éligible s'il y a un pack Longrich pour lui ("batisseurPro" et
// au-dessus), pas une liste séparée à tenir à jour en double. Comme Ma
// Tontine (voir Tontine/index.jsx), la page suit "activeLevelKey" (voir
// context/MemberLevelContext.jsx) : changer de niveau depuis la carte de
// profil bascule entre le contenu complet (synthèse + packs + réseau) et
// le message d'invitation à entrer dans le MLM (MlmIneligible.jsx, qui
// réaffiche l'escalier des packs comme porte d'entrée).
//
// La recherche de l'en-tête cherche un filleul par son nom (liste "Mon
// réseau") ou un pack Longrich par son nom (l'escalier : quand au moins un
// pack correspond, les autres marches s'estompent plutôt que de disparaître,
// pour garder la forme d'escalier). Sans aucune correspondance, un seul
// message s'affiche sous l'en-tête.
export default function MembreMlm() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { report, noResults } = useSearchSummary(query);
  const { activeLevelKey } = useMemberLevel();
  const isEligible = getLongrichPacks().some((pack) => pack.levelKey === activeLevelKey);

  return (
    <Page title={`${t("membre.nav.mlm")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar
          titleKey="membre.nav.mlm"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("membre.mlm.searchPlaceholder")}
        />
        {noResults && <SearchEmpty query={query} className="mt-6" />}
        {isEligible ? (
          <>
            <MlmOverview />
            <PacksLadder query={query} onMatches={report} />
            <MyNetwork query={query} onMatches={report} />
          </>
        ) : (
          <>
            <MlmIneligible activeLevelKey={activeLevelKey} />
            {/* highlightCurrent=false : un membre pas encore éligible n'a
                aucun pack "actuel" à mettre en avant (voir le commentaire
                dans PacksLadder.jsx) */}
            <PacksLadder highlightCurrent={false} query={query} onMatches={report} />
          </>
        )}
      </div>
    </Page>
  );
}
