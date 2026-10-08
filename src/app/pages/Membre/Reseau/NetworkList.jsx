// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, CircleStackIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { LEVEL_HEX, getInitials } from "../communityMembers";
import { getNetworkList } from "./mockData";

// ----------------------------------------------------------------------

// Vue "Liste" de Mon Réseau : les MÊMES personnes que l'arbre
// (NetworkTree.jsx), à plat, pour retrouver quelqu'un par son nom quand le
// réseau grandit — un arbre de 100 cartes n'est plus lisible. Recherche
// tolérante aux accents (searchUtils, comme partout côté admin) et filtre
// par lien (parrains / mes filleuls / leurs filleuls). Un clic sur une
// ligne ouvre la même fiche "CV" que dans l'arbre ("onSelect").
const GROUPS = {
  all: null,
  sponsors: ["sponsor", "sponsorOfSponsor"],
  direct: ["direct"],
  indirect: ["indirect"],
};
const RELATION_CHIPS = {
  sponsor: "bg-amber-100 text-amber-700",
  sponsorOfSponsor: "bg-gray-100 text-gray-500",
  direct: "bg-[#52A2DF]/[0.14] text-[#2f78b4]",
  indirect: "bg-gray-100 text-gray-500",
};
const STATUS_DOTS = { actif: "bg-green-500", attente: "bg-amber-400" };

// "searchQuery" : la recherche de l'en-tête de la page (voir Reseau/index.jsx),
// qui s'ajoute à la recherche propre de cette vue — les deux champs filtrent
// ensemble.
export function NetworkList({ onSelect, searchQuery = "" }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");

  const rows = getNetworkList().filter(
    (node) =>
      (GROUPS[group] === null || GROUPS[group].includes(node.relation)) &&
      searchTextIncludes(node.member.name, query) &&
      searchTextIncludes(node.member.name, searchQuery),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">{t("membre.reseau.list.search")}</span>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("membre.reseau.list.search")}
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#52A2DF]"
          />
        </label>

        <div role="group" aria-label={t("membre.reseau.list.filterLabel")} className="inline-flex flex-wrap rounded-full bg-gray-100 p-0.5">
          {Object.keys(GROUPS).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={group === key}
              onClick={() => setGroup(key)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                group === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
              )}
            >
              {t(`membre.reseau.list.group.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 && (
        <p className="mt-6 py-6 text-center text-sm text-gray-500">{t("membre.reseau.list.empty")}</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {rows.map((node) => {
          const { member, relation } = node;
          const level = levels.find((l) => l.key === member.levelKey);
          const Icon = level?.Icon;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(node)}
              className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3 text-left shadow-sm transition-colors hover:bg-gray-50/70"
            >
              <span className="relative shrink-0">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: LEVEL_HEX[member.levelKey] }}
                >
                  {getInitials(member.name)}
                </span>
                <span
                  aria-hidden="true"
                  className={clsx("absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-white", STATUS_DOTS[member.status])}
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      level?.borderClass,
                      level?.textClass,
                      level?.bgTintClass,
                    )}
                  >
                    {Icon && <Icon aria-hidden="true" className="size-3" />}
                    {t(`simulateur.levels.${member.levelKey}.name`)}
                  </span>
                  <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold", RELATION_CHIPS[relation])}>
                    {relation === "indirect"
                      ? t("membre.reseau.relationDetail.indirect", { name: node.parentName })
                      : t(`membre.reseau.relation.${relation}`)}
                  </span>
                </div>
              </div>

              <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-gray-900">
                <CircleStackIcon aria-hidden="true" className="size-3.5 text-amber-500" />
                {member.coins}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
