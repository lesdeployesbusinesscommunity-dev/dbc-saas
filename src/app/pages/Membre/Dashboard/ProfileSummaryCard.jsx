// Import Dependencies
import { CircleStackIcon, IdentificationIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { Avatar } from "app/pages/Admin/components/Avatar";
import { levels, formatMoney } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { getMemberCoins } from "../Coins/mockData";
import { useMemberLevel } from "../context/MemberLevelContext";
import { LevelSwitcherBadge } from "../components/LevelSwitcherBadge";

// ----------------------------------------------------------------------

// Carte de profil du membre connecté, sous le bandeau de bienvenue (voir
// maquette fournie) : avatar, nom + badge de niveau, profession, puis 3
// indicateurs (DBC Coins, Cagnotte du niveau, Grade). "cagnotte" et le
// nom du niveau ("DBC Starter", "DBC Elite"...) viennent directement du
// catalogue Simulateur (même source que le simulateur de niveaux, voir
// Simulateur/data.js) plutôt que d'être recopiés ici, pour ne jamais
// désynchroniser ces chiffres du reste du site.
//
// Le badge de niveau est cliquable : un membre peut cotiser à plusieurs
// niveaux en même temps (ex: Starter à 5 000 F/mois ET Bâtisseur à
// 10 000 F/mois — voir currentMember.js : "levelKeys"), donc cliquer
// dessus propose les autres niveaux du membre plutôt que les 8 niveaux
// DBC en entier (contrairement au sélecteur admin, voir LevelSelector.jsx,
// qui sert à survoler tout le catalogue). Changer de sélection met à jour
// "activeLevelKey" dans MemberLevelContext, et donc la cagnotte/le grade
// ici, mais aussi la cotisation du mois et les formations en cours plus
// bas sur la page (voir RightPanel/TontineStatus.jsx et
// TrainingsInProgress.jsx), qui lisent ce même contexte. Le badge
// lui-même est extrait dans components/LevelSwitcherBadge.jsx — réutilisé
// tel quel sur "Ma Tontine" (voir Tontine/index.jsx).
//
// Le matricule du membre (currentMember.js : "matricule") figure sous sa
// profession : c'est son identifiant unique, et celui qu'il donne pour
// parrainer quelqu'un (voir Reseau/InviteCard.jsx).
export function ProfileSummaryCard() {
  const { t } = useTranslation();
  const { activeLevelKey } = useMemberLevel();

  const levelIndex = levels.findIndex((level) => level.key === activeLevelKey);
  const level = levels[levelIndex] ?? levels[0];

  return (
    <div className="mt-6 rounded-2xl border border-[#EE7115]/30 bg-[#EE7115]/5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={currentMember.name} src={currentMember.photo} size="size-16" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-gray-900">{currentMember.name}</p>
            <LevelSwitcherBadge />
          </div>
          <p className="mt-0.5 truncate text-sm text-gray-500">{currentMember.domain}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
            <IdentificationIcon aria-hidden="true" className="size-3.5 text-[#EE7115]" />
            {t("membre.dashboard.profile.matricule", { matricule: currentMember.matricule })}
          </p>
        </div>
      </div>

      <div className="mt-5 flex divide-x divide-black/10 border-t border-black/5 pt-4">
        <div className="flex-1 pr-4">
          <p className="flex items-center gap-1.5 text-base font-bold text-gray-900">
            <CircleStackIcon aria-hidden="true" className="size-4 text-[#EE7115]" />
            {getMemberCoins()}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{t("membre.dashboard.profile.coins")}</p>
        </div>
        <div className="flex-1 px-4">
          <p className="text-base font-bold text-gray-900">{formatMoney(level.cagnotte)}</p>
          <p className="mt-0.5 text-xs text-gray-500">{t("membre.dashboard.profile.cagnotte")}</p>
        </div>
        <div className="flex-1 pl-4">
          <p className="text-base font-bold text-gray-900">
            {t("membre.dashboard.profile.levelFraction", { n: levelIndex + 1, total: levels.length })}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{t("membre.dashboard.profile.grade")}</p>
        </div>
      </div>
    </div>
  );
}
