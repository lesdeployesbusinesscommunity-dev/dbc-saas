// Import Dependencies
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
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
export default function MembreReseau() {
  const { t } = useTranslation();

  return (
    <Page title={`${t("membre.nav.reseau")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar titleKey="membre.nav.reseau" />
        <NetworkStats />
        <InviteCard />
        <NetworkActivity />
        <NetworkTree />
        <NetworkEarnings />
      </div>
    </Page>
  );
}
