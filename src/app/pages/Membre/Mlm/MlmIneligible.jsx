// Import Dependencies
import { useTranslation } from "react-i18next";
import { CheckBadgeIcon, LockClosedIcon } from "@heroicons/react/24/solid";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { ConfirmRequestPopover } from "../components/ConfirmRequestPopover";
import { useMemberLevel } from "../context/MemberLevelContext";
import { getLongrichPacks } from "./mockData";

// ----------------------------------------------------------------------

// Message affiché à la place du contenu MLM (arbre, réseau) quand le
// niveau DBC consulté n'y donne pas accès (voir index.jsx : seuls les
// niveaux qui ont un pack dans "getLongrichPacks" y donnent droit —
// "starter" et "batisseur" n'en ont pas, voir mockData.js). Le palier
// minimum ("batisseurPro", le premier pack de la liste) est annoncé
// nommément pour que le membre sache quoi viser, puis l'escalier des 6
// packs (PacksLadder.jsx) est repris tel quel juste en dessous — "pour
// lui indiquer comment entrer dans le MLM", demandé explicitement — sans
// dupliquer ce composant.
//
// Deux cas, selon que le membre a ou non un niveau qui donne accès au MLM :
// - il n'en a AUCUN : "Solliciter ce niveau" (même popover de confirmation
//   que la colonne "Solliciter" du tableau comparatif du Dashboard) pour
//   demander le palier requis ;
// - il en a déjà un (il est seulement en train de consulter un niveau
//   inférieur, voir MemberLevelContext) : on le lui RAPPELLE et "Activer ce
//   niveau" le choisit comme niveau consulté — la page bascule alors sur le
//   contenu MLM complet, sans repasser par la carte de profil.
export function MlmIneligible({ activeLevelKey }) {
  const { t } = useTranslation();
  const currentLevel = levels.find((l) => l.key === activeLevelKey);
  const requiredLevelKey = getLongrichPacks()[0]?.levelKey;
  const requiredLevel = levels.find((l) => l.key === requiredLevelKey);
  const requiredLevelName = requiredLevel ? t(`simulateur.levels.${requiredLevel.key}.name`) : requiredLevelKey;
  const { setActiveLevelKey } = useMemberLevel();
  // Le premier niveau du membre qui donne accès au MLM, s'il en a un.
  const ownedEligibleKey = getLongrichPacks()
    .map((pack) => pack.levelKey)
    .find((key) => currentMember.levelKeys.includes(key));
  const ownedLevelName = ownedEligibleKey ? t(`simulateur.levels.${ownedEligibleKey}.name`) : "";
  const currentLevelName = currentLevel ? t(`simulateur.levels.${currentLevel.key}.name`) : activeLevelKey;

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm sm:p-10">
      <span
        aria-hidden="true"
        className={
          ownedEligibleKey
            ? "mx-auto flex size-12 items-center justify-center rounded-full bg-green-50 text-[#16A34A]"
            : "mx-auto flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"
        }
      >
        {ownedEligibleKey ? <CheckBadgeIcon className="size-6" /> : <LockClosedIcon className="size-6" />}
      </span>

      <p className="mt-4 text-base font-bold text-gray-900">
        {ownedEligibleKey
          ? t("membre.mlm.ineligible.ownedTitle", { level: ownedLevelName })
          : t("membre.mlm.ineligible.title")}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        {ownedEligibleKey
          ? t("membre.mlm.ineligible.ownedMessage", { currentLevel: currentLevelName, level: ownedLevelName })
          : t("membre.mlm.ineligible.message", {
              currentLevel: currentLevelName,
              requiredLevel: requiredLevelName,
            })}
      </p>

      <div className="mt-6 flex justify-center">
        {ownedEligibleKey ? (
          <button
            type="button"
            onClick={() => setActiveLevelKey(ownedEligibleKey)}
            className="inline-flex items-center justify-center rounded-lg bg-[#52A2DF] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("membre.mlm.ineligible.activateButton")}
          </button>
        ) : (
          <ConfirmRequestPopover
            triggerClassName="inline-flex items-center justify-center rounded-lg bg-[#52A2DF] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            question={t("membre.dashboard.comparison.requestQuestion", { level: requiredLevelName })}
            request={{ type: "level", levelKey: requiredLevelKey }}
          >
            {t("membre.mlm.ineligible.requestButton")}
          </ConfirmRequestPopover>
        )}
      </div>
    </div>
  );
}
