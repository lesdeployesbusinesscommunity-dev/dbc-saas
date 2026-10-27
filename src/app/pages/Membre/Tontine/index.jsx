// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { currentMember } from "../currentMember";
import { TopBar } from "../Dashboard/TopBar";
import { LevelSwitcherBadge } from "../components/LevelSwitcherBadge";
import { SearchEmpty } from "../components/SearchEmpty";
import { useSearchSummary } from "../components/searchSummary";
import { CagnotteHero } from "./CagnotteHero";
import { MyTontineStatus } from "./MyTontineStatus";
import { PrioritySection } from "./PrioritySection";
import { StatusLegend } from "./StatusLegend";
import { TontineFaq } from "./TontineFaq";
import { TontineCycle } from "./TontineCycle";
import { CotisationTracking } from "./CotisationTracking";
import { CycleHistory } from "./CycleHistory";
import { NextStepButton } from "./NextStepButton";
import { TontineGuide } from "app/pages/Admin/Tontine/guide/TontineGuide";

// ----------------------------------------------------------------------

// Page "Ma Tontine" (/membre/tontine) : la cagnotte du mois (bannière),
// "Mon suivi" (quand je dois payer, quand c'est mon tour — MyTontineStatus,
// voir ce fichier), la légende des statuts du cycle (expliquée AVANT la
// liste — demandé explicitement, cette page touche au cœur du
// fonctionnement de la tontine) suivie d'un "Comment ça marche ?" replié
// par défaut pour les nouveaux membres (TontineFaq), le cycle complet des
// 12 mois, le suivi des cotisations de tout le groupe, l'historique des
// cycles déjà clôturés avant celui-ci (CycleHistory), puis le bouton
// "Choisir la suite" (actif seulement une fois un cycle terminé). Tout
// dépend du niveau actuellement consulté (voir MemberLevelContext, posé
// plus haut dans MembreLayout.jsx) — le badge à côté du titre (même
// composant que la carte de profil du Dashboard, voir
// components/LevelSwitcherBadge.jsx) permet de changer de niveau
// directement depuis cette page, sans repasser par le Dashboard.
//
// "Mon ordre de passage" (PrioritySection) : l'ordre dans lequel le groupe reçoit
// la cagnotte est décidé par la plateforme (Score de Priorité DBC), pas par les
// membres : ma note sur 100, mon rang, et la feuille de route qui explique le calcul.
//
// Les membres ne choisissent plus leur mois : l'administration les place, et
// départage elle-même les égalités de score.
//
// La recherche de l'en-tête cherche un membre du groupe par son nom : elle
// filtre le cycle des 12 tours et le suivi des cotisations (voir
// TontineCycle.jsx et CotisationTracking.jsx). La bannière, "Mon suivi" et
// l'historique parlent de moi, pas du groupe : ils ne bougent pas. Une liste
// sans correspondance disparaît ; un seul message s'affiche sous l'en-tête
// quand plus aucune des deux ne correspond.
export default function MembreTontine() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { report, noResults } = useSearchSummary(query);

  return (
    <Page title={`${t("membre.nav.tontine")} – ${currentMember.name}`}>
      <div className="p-6 lg:p-8">
        <TopBar
          titleKey="membre.nav.tontine"
          titleExtra={<LevelSwitcherBadge />}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("membre.tontine.searchPlaceholder")}
        />
        {noResults && <SearchEmpty query={query} className="mt-6" />}
        <div className="mt-4 flex justify-end">
          <TontineGuide voice="member" />
        </div>
        <CagnotteHero />
        <MyTontineStatus />
        <PrioritySection />
        <StatusLegend />
        <TontineFaq />
        <TontineCycle query={query} onMatches={report} />
        <CotisationTracking query={query} onMatches={report} />
        <CycleHistory />
        <NextStepButton />
      </div>
    </Page>
  );
}
