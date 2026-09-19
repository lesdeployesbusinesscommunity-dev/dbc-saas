// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { formatMoney, levels } from "app/pages/Simulateur/data";
import { ComparisonTable } from "app/pages/Simulateur/ComparisonTable";
import { AdminTopBar } from "../components/AdminTopBar";
import { FinanceStatCard } from "./FinanceStatCard";
import { getFinanceForLevel } from "./mockData";

// ----------------------------------------------------------------------

// Page "Gestion financière" (/admin/finance) : 4 cartes-clés + le nombre
// de membres du niveau en petite ligne à part (pas une 5e carte, pour
// garder les 4 cartes comme demandé — le nombre de membres reste visible
// juste en dessous). Ces chiffres ne sont pas fixes : ils varient selon
// le niveau actuellement sélectionné (voir mockData.js, un jeu de
// données par niveau). Le niveau se choisit directement en cliquant une
// ligne du tableau comparatif repris de "Simulateur de revenus" (côté
// visiteur) juste en dessous des cartes — voir ComparisonTable.jsx, qui
// gagne ici une prop "onSelect" optionnelle sans rien changer à son
// usage côté visiteur. Tout est en local pour l'instant (voir mockData.js),
// comme le reste de l'admin, en attendant les vrais endpoints.
export default function Finance() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const [selectedLevel, setSelectedLevel] = useState(levels[0]);
  const finance = getFinanceForLevel(selectedLevel.key);

  return (
    <Page title={`Admin – ${t("admin.finance.title")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar title={t("admin.finance.title")} />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold",
              selectedLevel.borderClass,
              selectedLevel.textClass,
              selectedLevel.bgTintClass,
            )}
          >
            <selectedLevel.Icon aria-hidden="true" className="size-3.5" />
            {t(`simulateur.levels.${selectedLevel.key}.name`)}
          </span>
          <p className="text-sm text-gray-500">{t("admin.finance.currentLevelHint")}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinanceStatCard
            Icon={BanknotesIcon}
            color="#52A2DF"
            value={formatMoney(finance.currentPot, locale)}
            label={t("admin.finance.cards.currentPot")}
          />
          <FinanceStatCard
            Icon={ArchiveBoxIcon}
            color="#EE7115"
            value={formatMoney(finance.totalCollected, locale)}
            label={`${t("admin.finance.cards.totalCollected")} ${t("admin.finance.cards.toursCount", { count: finance.toursCompleted })}`}
          />
          <FinanceStatCard
            Icon={CheckBadgeIcon}
            color="#16A34A"
            value={`${finance.contributionsReceived}/${finance.contributionsExpected}`}
            label={t("admin.finance.cards.contributions")}
          />
          <FinanceStatCard
            Icon={ArrowPathIcon}
            color="#7C3AED"
            value={t("admin.finance.cards.cycleValue", {
              current: finance.currentTour,
              total: finance.totalTours,
            })}
            label={t("admin.finance.cards.cycle")}
          />
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-500">
          <UserGroupIcon aria-hidden="true" className="size-4 text-gray-400" />
          {t("admin.finance.memberCount", { count: finance.memberCount })}
        </div>
      </div>

      <ComparisonTable levels={levels} selectedKey={selectedLevel.key} onSelect={setSelectedLevel} />
    </Page>
  );
}
