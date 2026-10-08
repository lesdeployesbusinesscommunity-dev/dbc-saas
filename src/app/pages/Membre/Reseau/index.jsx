// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { SearchEmpty } from "../components/SearchEmpty";
import { useSearchSummary } from "../components/searchSummary";
import { NetworkStats } from "./NetworkStats";
import { InviteCard } from "./InviteCard";
import { NetworkActivity } from "./NetworkActivity";
import { NetworkTree } from "./NetworkTree";
import { NetworkEarnings } from "./NetworkEarnings";

// ----------------------------------------------------------------------

// Page "Mon Réseau" (/membre/reseau) : met en évidence qui est le parrain
// du membre et qui il a parrainé. Dans l'ordre : les chiffres
// (NetworkStats.jsx), le moyen de faire grandir son réseau (InviteCard.jsx),
// ce qui demande une action (NetworkActivity.jsx), l'illustration
// cliquable avec sa vue "Liste" (NetworkTree.jsx / NetworkList.jsx), puis
// ce que le réseau rapporte (NetworkEarnings.jsx). À ne pas confondre avec
// la section "Mon réseau" de Mon MLM (Mlm/MyNetwork.jsx), qui liste les
// filleuls avec leurs commissions Longrich : ici c'est la lignée de
// parrainage elle-même, sans notion de commission.
//
// La recherche de l'en-tête cherche une personne de mon réseau par son nom :
// elle filtre les relances de "Activité du réseau" et bascule la lignée en
// vue "Liste" (un arbre ne se filtre pas), voir NetworkTree.jsx. Un bloc sans
// correspondance disparaît ; un seul message s'affiche sous l'en-tête quand
// aucun des deux ne correspond.
export default function MembreReseau() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { report, noResults } = useSearchSummary(query);

  return (
    <Page title={`${t("membre.nav.reseau")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar
          titleKey="membre.nav.reseau"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("membre.reseau.searchPlaceholder")}
        />
        {noResults && <SearchEmpty query={query} className="mt-6" />}
        <NetworkStats />
        <InviteCard />
        <NetworkActivity query={query} onMatches={report} />
        <NetworkTree query={query} onMatches={report} />
        <NetworkEarnings />
      </div>
    </Page>
  );
}
