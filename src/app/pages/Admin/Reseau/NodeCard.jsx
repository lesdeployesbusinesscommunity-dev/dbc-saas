// Import Dependencies
import { useTranslation } from "react-i18next";
import { MapPinIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";

// ----------------------------------------------------------------------

// L'avatar rétrécit légèrement à mesure qu'on descend dans la hiérarchie,
// pour que l'œil suive naturellement le niveau d'importance sans avoir
// besoin de le lire (au-delà de la 3e profondeur, la taille n'est plus
// réduite : Math.min ci-dessous plafonne l'index).
const AVATAR_SIZES = ["size-24", "size-20", "size-16"];

// Une "carte" de l'arbre de parrainage réel : chaque nœud est un membre
// réel (jamais vacant — voir Reseau/index.jsx, l'arbre vient de GET
// /reseau-mlm/reseau-global). Le badge affiche son vrai niveau DBC (plus
// de titre de rôle inventé/renommable) ; cliquer la carte ouvre sa fiche
// complète (voir MemberDetailsCard, ouverte par Reseau/index.jsx).
export function NodeCard({ node, depth, onViewMember, matchState }) {
  const { t } = useTranslation();
  const avatarSize = AVATAR_SIZES[Math.min(depth, AVATAR_SIZES.length - 1)];
  const isRoot = depth === 0;

  return (
    <div
      className={clsx(
        "flex w-44 flex-col items-center rounded-2xl px-1 py-2 text-center transition-all",
        // "match" : résultat direct de la recherche en cours (voir
        // OrgTree.jsx) -> ressort avec un halo orange. "dim" : ni un
        // résultat ni sur son chemin -> estompé pour laisser ressortir les
        // résultats.
        matchState === "match" && "bg-[#EE7115]/[0.06] ring-2 ring-[#EE7115]/60",
        matchState === "dim" && "opacity-30",
      )}
    >
      <span
        className={clsx(
          "mb-2.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
          isRoot ? "bg-[#EE7115]/[0.12] text-[#EE7115]" : "bg-[#52A2DF]/[0.12] text-[#52A2DF]",
        )}
      >
        {node.member.levelName}
      </span>

      <button
        type="button"
        onClick={onViewMember}
        title={t("admin.reseau.viewMember")}
        className="group flex flex-col items-center"
      >
        <Avatar
          name={node.member.name}
          size={avatarSize}
          className={clsx(
            "ring-4 ring-offset-2 transition-transform group-hover:scale-105",
            isRoot ? "ring-[#EE7115]/30" : "ring-[#52A2DF]/30",
          )}
        />
        <p className="mt-3 text-sm font-bold leading-tight text-gray-900 group-hover:text-[#52A2DF]">
          {node.member.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#52A2DF]">
          <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {node.member.city || node.member.country || node.member.matricule}
        </p>
      </button>
    </div>
  );
}
