// Import Dependencies
import { useTranslation } from "react-i18next";
import { UsersIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { formatMoney, levels } from "app/pages/Simulateur/data";
import { getMlmStats, getNetworkMembers } from "./mockData";

// ----------------------------------------------------------------------

// "Mon réseau" : les filleuls du membre, groupés par profondeur (directs
// niveau 1 / indirects niveau 2+, voir mockData.js) plutôt qu'en un seul
// tableau plat — fait mieux ressortir la structure de parrainage que
// l'escalier des packs (PacksLadder.jsx), qui ordonne des PRIX et non des
// personnes. Chaque ligne reprend la couleur/icône déjà établie pour le
// rang DBC du filleul (voir Simulateur/data.js : "levels") : l'avatar, lui,
// n'a pas de niveau propre à représenter, ses couleurs ne font que
// distinguer visuellement les filleuls entre eux (cycle fixe de teintes
// déjà utilisées ailleurs dans l'app, pas une nouvelle palette).
const AVATAR_COLORS = ["#52A2DF", "#4F46E5", "#16A34A", "#EE7115", "#E11D48"];

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MyNetwork() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("fr") ? "fr-FR" : "en-US";
  const stats = getMlmStats();
  const members = getNetworkMembers();
  const directMembers = members.filter((m) => m.type === "direct");
  const indirectMembers = members.filter((m) => m.type === "indirect");

  const renderRow = (member, index) => {
    const level = levels[member.levelPosition - 1];
    const Icon = level?.Icon;

    return (
      <div
        key={member.id}
        className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
        >
          {getInitials(member.name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
          <p className="text-xs text-gray-500">{t(`membre.mlm.network.type.${member.type}`)}</p>
        </div>

        <span
          className={clsx(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold",
            level?.borderClass,
            level?.textClass,
            level?.bgTintClass,
          )}
        >
          {Icon && <Icon aria-hidden="true" className="size-3" />}
          {t("membre.mlm.network.levelBadge", { n: member.levelPosition })}
        </span>

        <span className="shrink-0 text-sm font-bold text-gray-900">
          {formatMoney(member.commission, locale)}
        </span>
      </div>
    );
  };

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <UsersIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
        {t("membre.mlm.network.title", { levels: stats.networkLevels })}
      </h2>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {t("membre.mlm.network.directGroup")}
        </p>
        <div className="mt-2 flex flex-col gap-2">{directMembers.map(renderRow)}</div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {t("membre.mlm.network.indirectGroup")}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {indirectMembers.map((member, index) => renderRow(member, directMembers.length + index))}
        </div>
      </div>
    </div>
  );
}
