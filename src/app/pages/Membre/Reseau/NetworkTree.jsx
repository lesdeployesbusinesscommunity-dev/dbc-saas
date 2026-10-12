// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShareIcon, ListBulletIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { levels } from "app/pages/Simulateur/data";
import { currentMember } from "../currentMember";
import { LEVEL_HEX, getInitials } from "../communityMembers";
import { searchTextIncludes } from "app/pages/Admin/searchUtils";
import { MemberCvModal } from "../Coins/MemberCvModal";
import { useReportMatches } from "../components/searchSummary";
import { getSponsorChain, getReferralTree, getNetworkList, getNetworkSummary } from "./mockData";
import { NetworkList } from "./NetworkList";

// ----------------------------------------------------------------------

// "Ma lignée de parrainage" : un arbre qui se lit de haut en bas — mes
// parrains au-dessus, moi au centre, mes filleuls en dessous (puis LEURS
// filleuls, un niveau plus bas). Chaque personne est une carte cliquable
// qui ouvre sa fiche "CV" (MemberCvModal, la même que dans le classement
// des Coins), avec en plus "Appeler" et "WhatsApp" (showContact). Une
// bascule "Arbre / Liste" propose la même lignée à plat avec recherche
// (NetworkList.jsx). La couleur de la pastille de relation suffit à savoir qui
// est qui sans légende : orange = mon parrain, bleu = mes filleuls
// directs, gris = le reste de la lignée.
const RELATION_CHIPS = {
  sponsor: "bg-amber-100 text-amber-700",
  sponsorOfSponsor: "bg-gray-100 text-gray-500",
  direct: "bg-[#52A2DF]/[0.14] text-[#2f78b4]",
  indirect: "bg-gray-100 text-gray-500",
};
const STATUS_DOTS = { actif: "bg-green-500", attente: "bg-amber-400" };

function Stem() {
  return <div aria-hidden="true" className="h-6 w-0.5 bg-gray-300" />;
}

function MemberNode({ node, onSelect }) {
  const { t } = useTranslation();
  const { member, relation } = node;
  const level = levels.find((l) => l.key === member.levelKey);
  const Icon = level?.Icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className="flex w-44 flex-col items-center rounded-2xl border border-black/5 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="relative">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: LEVEL_HEX[member.levelKey] }}
        >
          {getInitials(member.name)}
        </span>
        <span
          aria-hidden="true"
          className={clsx("absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-white", STATUS_DOTS[member.status])}
        />
      </span>
      <span className="mt-2 w-full truncate text-sm font-semibold text-gray-900">{member.name}</span>
      <span
        className={clsx(
          "mt-1 inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
          level?.borderClass,
          level?.textClass,
          level?.bgTintClass,
        )}
      >
        {Icon && <Icon aria-hidden="true" className="size-3 shrink-0" />}
        <span className="truncate">{t(`simulateur.levels.${member.levelKey}.name`)}</span>
      </span>
      <span className={clsx("mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold", RELATION_CHIPS[relation])}>
        {t(`membre.reseau.relation.${relation}`)}
      </span>
    </button>
  );
}

function MeNode() {
  const { t } = useTranslation();
  return (
    <div className="flex w-48 flex-col items-center rounded-2xl bg-gradient-to-br from-[#52A2DF] to-[#3d6fb0] p-4 text-center shadow-lg">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-white text-base font-bold text-[#3d6fb0]"
      >
        {getInitials(currentMember.name)}
      </span>
      <span className="mt-2 w-full truncate text-sm font-bold text-white">{currentMember.name}</span>
      <span className="mt-2 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
        {t("membre.reseau.me")}
      </span>
    </div>
  );
}

// Un filleul et, en dessous, ses propres filleuls (récursif). Les traits
// qui relient les frères à leur parent sont dessinés par chaque colonne :
// un tiret vertical au centre et un trait horizontal dont la longueur
// dépend de la position (le premier ne part que vers la droite, le dernier
// que vers la gauche, ceux du milieu des deux côtés) — pour que l'ensemble
// forme une seule barre continue sans dépasser.
function Branch({ node, onSelect }) {
  return (
    <div className="flex flex-col items-center">
      <MemberNode node={node} onSelect={onSelect} />
      <ChildrenRow nodes={node.children} onSelect={onSelect} />
    </div>
  );
}

function ChildrenRow({ nodes, onSelect }) {
  if (nodes.length === 0) return null;

  return (
    <>
      <Stem />
      <div className="flex items-start">
        {nodes.map((child, index) => {
          const isFirst = index === 0;
          const isLast = index === nodes.length - 1;
          return (
            <div key={child.member.id} className="relative flex flex-col items-center px-2 pt-6">
              {nodes.length > 1 && (
                <div
                  aria-hidden="true"
                  className={clsx(
                    "absolute top-0 h-0.5 bg-gray-300",
                    isFirst ? "left-1/2 right-0" : isLast ? "left-0 right-1/2" : "left-0 right-0",
                  )}
                />
              )}
              <div aria-hidden="true" className="absolute left-1/2 top-0 h-6 w-0.5 -translate-x-1/2 bg-gray-300" />
              <Branch node={child} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
    </>
  );
}

// "query" : la recherche de l'en-tête (voir index.jsx). Tant qu'elle est
// remplie, la lignée s'affiche en vue "Liste" (seule vue qui se filtre) et
// le bouton "Arbre" est désactivé ; l'effacer ramène la vue choisie. Sans
// personne qui corresponde, le bloc disparaît (voir searchSummary.js).
export function NetworkTree({ query = "", onMatches }) {
  const { t } = useTranslation();
  const sponsors = getSponsorChain();
  const tree = getReferralTree();
  const summary = getNetworkSummary();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("tree");
  const hasQuery = query.trim() !== "";
  const shownView = hasQuery ? "list" : view;
  const matchCount = getNetworkList().filter((node) => searchTextIncludes(node.member.name, query)).length;
  useReportMatches(onMatches, "lineage", matchCount);

  // Aucune personne ne correspond : tout le bloc disparaît.
  if (hasQuery && matchCount === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <ShareIcon aria-hidden="true" className="size-5 text-[#52A2DF]" />
          {t("membre.reseau.title")}
        </h2>
        <div role="group" aria-label={t("membre.reseau.view.label")} className="inline-flex rounded-full bg-gray-100 p-0.5">
          {[
            { key: "tree", Icon: ShareIcon },
            { key: "list", Icon: ListBulletIcon },
          ].map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={shownView === key}
              disabled={hasQuery && key === "tree"}
              onClick={() => setView(key)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                shownView === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                hasQuery && key === "tree" && "cursor-not-allowed opacity-40",
              )}
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {t(`membre.reseau.view.${key}`)}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">{t("membre.reseau.hint")}</p>

      {shownView === "list" ? (
        <div className="mt-6">
          <NetworkList onSelect={setSelected} searchQuery={query} />
        </div>
      ) : (
      <div className="mt-6 overflow-x-auto pb-2">
        <div className="mx-auto flex w-max min-w-full flex-col items-center">
          {sponsors.map((node) => (
            <div key={node.member.id} className="flex flex-col items-center">
              <MemberNode node={node} onSelect={setSelected} />
              <Stem />
            </div>
          ))}
          <MeNode />
          <ChildrenRow nodes={tree} onSelect={setSelected} />
        </div>
      </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <p>{t("membre.reseau.preview", { shown: summary.shown, total: summary.totalNetwork })}</p>
        <p className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-green-500" />
            {t("membre.reseau.status.active")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-amber-400" />
            {t("membre.reseau.status.pending")}
          </span>
        </p>
      </div>

      <MemberCvModal
        member={selected?.member ?? null}
        open={!!selected}
        onClose={() => setSelected(null)}
        showContact
        relationLabel={
          selected
            ? selected.relation === "indirect"
              ? t("membre.reseau.relationDetail.indirect", { name: selected.parentName })
              : t(`membre.reseau.relation.${selected.relation}`)
            : undefined
        }
      />
    </div>
  );
}
