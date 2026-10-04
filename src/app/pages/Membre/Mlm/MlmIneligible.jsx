// Import Dependencies
import { useTranslation } from "react-i18next";
import { LockClosedIcon } from "@heroicons/react/24/solid";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
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
export function MlmIneligible({ activeLevelKey }) {
  const { t } = useTranslation();
  const currentLevel = levels.find((l) => l.key === activeLevelKey);
  const requiredLevelKey = getLongrichPacks()[0]?.levelKey;
  const requiredLevel = levels.find((l) => l.key === requiredLevelKey);

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm sm:p-10">
      <span
        aria-hidden="true"
        className="mx-auto flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"
      >
        <LockClosedIcon className="size-6" />
      </span>

      <p className="mt-4 text-base font-bold text-gray-900">
        {t("membre.mlm.ineligible.title")}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        {t("membre.mlm.ineligible.message", {
          currentLevel: currentLevel ? t(`simulateur.levels.${currentLevel.key}.name`) : activeLevelKey,
          requiredLevel: requiredLevel ? t(`simulateur.levels.${requiredLevel.key}.name`) : requiredLevelKey,
        })}
      </p>
    </div>
  );
}
