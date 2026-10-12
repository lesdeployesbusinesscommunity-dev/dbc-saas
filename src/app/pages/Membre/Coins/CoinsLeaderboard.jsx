// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrophyIcon, CircleStackIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { useReportMatches } from "../components/searchSummary";
import { LEVEL_HEX, getInitials } from "../communityMembers";
import { getLeaderboard, getLeaderboardLevelKeys, getCommunityRanks } from "./mockData";
import { MemberCvModal } from "./MemberCvModal";
import { LevelDetailModal } from "./LevelDetailModal";

// ----------------------------------------------------------------------

// Couleurs de rang (médailles) : séparées des couleurs de niveau DBC
// (Simulateur/data.js) — un rang n'est qu'une position dans CE classement,
// pas un niveau DBC, donc sa propre petite échelle à 3 teintes plutôt que
// de réutiliser la couleur d'un niveau pour une notion différente.
const RANK_STYLES = {
  1: "bg-amber-400 text-white",
  2: "bg-gray-300 text-white",
  3: "bg-amber-700 text-white",
};
const RANK_DEFAULT = "bg-gray-100 text-gray-500";

// "Classement DBC Coins" : ni un tableau (déjà fait pour "Comment gagner
// des Coins", voir EarnCoinsTable.jsx) ni l'escalier des packs Longrich
// (voir Mlm/PacksLadder.jsx) — une liste de rangs avec une barre de
// progression par membre (longueur proportionnelle à son nombre de Coins
// par rapport au 1er de la liste affichée).
//
// Deux filtres : la période ("Depuis le début" / "Ce mois") et le niveau
// DBC. Le rang affiché est celui DANS la liste filtrée ; la fiche CV, elle,
// montre toujours le rang GLOBAL (voir mockData.js : "getCommunityRanks").
// Le membre connecté fait partie du classement ("Toi", ligne mise en
// évidence, non cliquable puisque c'est sa propre fiche) — c'est ce qui
// garantit que son rang ici est le même que dans la bannière.
//
// Chaque autre ligne ouvre la fiche "CV" du membre (MemberCvModal) — même
// principe que "Voir" côté admin (Admin/Membres/MemberDetailsCard.jsx). Le
// badge de niveau DBC ouvre un détail SÉPARÉ (LevelDetailModal, avec
// "Solliciter ce niveau") : stopPropagation() empêche le clic sur le badge
// d'ouvrir aussi la fiche — le badge est un <span role="button">, jamais
// un vrai <button> dans la ligne (qui, elle, en est un), pour rester du
// HTML valide (même précaution que Simulateur/ComparisonTable.jsx).
export function CoinsLeaderboard({ query = "", onMatches }) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("all");
  const [levelKey, setLevelKey] = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedLevelKey, setSelectedLevelKey] = useState(null);

  // La recherche de l'en-tête (voir Coins/index.jsx) ne retire que des
  // LIGNES : le rang affiché et la longueur des barres restent ceux du
  // classement complet, sinon chercher quelqu'un changerait son rang.
  const ranked = getLeaderboard({ period, levelKey });
  const entries = ranked.filter((entry) => searchTextIncludes(entry.name, query));
  const hasQuery = query.trim() !== "";
  const levelKeys = getLeaderboardLevelKeys();
  const globalRanks = getCommunityRanks();
  const maxValue = Math.max(1, ...ranked.map((entry) => entry.value));

  // Un classement vide à cause des filtres de période / niveau garde son
  // propre message et ne participe pas à la recherche.
  useReportMatches(onMatches, "leaderboard", ranked.length === 0 ? null : entries.length);

  if (hasQuery && ranked.length > 0 && entries.length === 0) return null;

  const openLevel = (key) => setSelectedLevelKey(key);

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <TrophyIcon aria-hidden="true" className="size-5 text-amber-500" />
          {t("membre.coins.leaderboard.title")}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t("membre.coins.leaderboard.periodLabel")} className="inline-flex rounded-full bg-gray-100 p-0.5">
            {["all", "month"].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  period === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                )}
              >
                {t(`membre.coins.leaderboard.period.${value}`)}
              </button>
            ))}
          </div>

          <select
            value={levelKey}
            onChange={(event) => setLevelKey(event.target.value)}
            aria-label={t("membre.coins.leaderboard.levelFilter.label")}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#52A2DF]"
          >
            <option value="all">{t("membre.coins.leaderboard.levelFilter.all")}</option>
            {levelKeys.map((key) => (
              <option key={key} value={key}>
                {t(`simulateur.levels.${key}.name`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="mt-6 py-6 text-center text-sm text-gray-500">{t("membre.coins.leaderboard.empty")}</p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {entries.map((entry) => {
          const level = levels.find((l) => l.key === entry.levelKey);
          const Icon = level?.Icon;
          const pct = Math.max(6, Math.round((entry.value / maxValue) * 100));
          const RowTag = entry.isMe ? "div" : "button";

          return (
            <RowTag
              key={entry.id}
              type={entry.isMe ? undefined : "button"}
              onClick={entry.isMe ? undefined : () => setSelectedMember({ ...entry, coins: entry.coins, rank: globalRanks[entry.id] })}
              className={clsx(
                "flex items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition-colors",
                entry.isMe
                  ? "border-[#52A2DF]/40 bg-[#52A2DF]/[0.07] ring-1 ring-[#52A2DF]/30"
                  : "border-black/5 bg-white hover:bg-gray-50/70",
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  RANK_STYLES[entry.rank] ?? RANK_DEFAULT,
                )}
              >
                {entry.rank === 1 ? <TrophyIcon className="size-4" /> : entry.rank}
              </span>

              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: LEVEL_HEX[entry.levelKey] }}
              >
                {getInitials(entry.name)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900">
                    <span className="truncate">{entry.name}</span>
                    {entry.isMe && (
                      <span className="shrink-0 rounded-full bg-[#52A2DF] px-2 py-0.5 text-[10px] font-bold text-white">
                        {t("membre.coins.leaderboard.me")}
                      </span>
                    )}
                  </p>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-gray-900">
                    <CircleStackIcon aria-hidden="true" className="size-3.5 text-amber-500" />
                    {entry.value}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      openLevel(entry.levelKey);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        openLevel(entry.levelKey);
                      }
                    }}
                    className={clsx(
                      "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-shadow hover:shadow-sm",
                      level?.borderClass,
                      level?.textClass,
                      level?.bgTintClass,
                    )}
                  >
                    {Icon && <Icon aria-hidden="true" className="size-3" />}
                    {t(`simulateur.levels.${entry.levelKey}.name`)}
                  </span>

                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: LEVEL_HEX[entry.levelKey] }}
                    />
                  </div>
                </div>
              </div>
            </RowTag>
          );
        })}
      </div>

      <MemberCvModal
        member={selectedMember}
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
      <LevelDetailModal
        levelKey={selectedLevelKey}
        open={!!selectedLevelKey}
        onClose={() => setSelectedLevelKey(null)}
      />
    </div>
  );
}
