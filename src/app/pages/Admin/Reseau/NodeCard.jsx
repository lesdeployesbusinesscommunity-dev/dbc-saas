// Import Dependencies
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPinIcon, PlusIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// Local Imports
import { Avatar } from "../components/Avatar";
import { getMember } from "./mockData";

// ----------------------------------------------------------------------

// L'avatar rétrécit légèrement à mesure qu'on descend dans la hiérarchie,
// pour que l'œil suive naturellement le niveau d'importance sans avoir
// besoin de le lire (au-delà de la 3e profondeur, la taille n'est plus
// réduite : Math.min ci-dessous plafonne l'index).
const AVATAR_SIZES = ["size-24", "size-20", "size-16"];

// Badge cliquable en haut de chaque carte : affiche le TITRE DE RÔLE de cet
// échelon (ex: "Le Visionnaire", "Responsable Régional") et permet de le
// renommer sur place (un simple clic transforme le badge en champ texte).
// Ce titre s'applique à toute une profondeur de l'arbre du pays courant
// (voir resolveLevelLabel dans mockData.js) — le renommer ici met donc à
// jour le badge de toutes les branches du même niveau, pas seulement celle
// de cette carte.
function LevelBadge({ label, isNational, onRename }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  useEffect(() => {
    if (!editing) setDraft(label);
  }, [label, editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== label) onRename(trimmed);
    else setDraft(label);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setDraft(label);
            setEditing(false);
          }
        }}
        className="mb-2.5 w-32 rounded-full border border-[#52A2DF] bg-white px-3 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#52A2DF] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={t("admin.reseau.renameLevel")}
      className={clsx(
        "mb-2.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
        isNational
          ? "bg-[#EE7115]/[0.12] text-[#EE7115] hover:bg-[#EE7115]/[0.2]"
          : "bg-[#52A2DF]/[0.12] text-[#52A2DF] hover:bg-[#52A2DF]/[0.2]",
      )}
    >
      {label}
    </button>
  );
}

// Une "carte" de l'arbre généalogique : soit un responsable déjà en poste
// (photo/initiales, nom, sa branche) — cliquer dessus ouvre sa fiche
// complète (voir NetworkMemberDetailsModal, ouverte par Reseau/index.jsx) —
// soit un poste vacant — un rond en pointillés sur lequel on peut cliquer
// directement pour l'assigner à un membre existant (voir MemberPickerModal,
// ouvert par Reseau/index.jsx).
export function NodeCard({
  node,
  depth,
  levelLabel,
  onAssign,
  onRenameLevel,
  onViewMember,
  matchState,
}) {
  const { t } = useTranslation();
  const member = node.memberId ? getMember(node.memberId) : null;
  const avatarSize = AVATAR_SIZES[Math.min(depth, AVATAR_SIZES.length - 1)];
  const isNational = depth === 0;

  return (
    <div
      className={clsx(
        "flex w-44 flex-col items-center rounded-2xl px-1 py-2 text-center transition-all",
        // "match" : résultat direct de la recherche en cours (voir
        // OrgTree.jsx) -> ressort avec un halo orange. "dim" : ni un
        // résultat ni sur son chemin -> estompé pour laisser ressortir les
        // résultats. Ni l'un ni l'autre (recherche inactive, ou nœud sur le
        // chemin d'un résultat) -> rendu inchangé.
        matchState === "match" && "bg-[#EE7115]/[0.06] ring-2 ring-[#EE7115]/60",
        matchState === "dim" && "opacity-30",
      )}
    >
      <LevelBadge label={levelLabel} isNational={isNational} onRename={onRenameLevel} />

      {member ? (
        <button
          type="button"
          onClick={onViewMember}
          title={t("admin.reseau.viewMember")}
          className="group flex flex-col items-center"
        >
          <Avatar
            name={member.name}
            src={member.photo}
            size={avatarSize}
            className={clsx(
              "ring-4 ring-offset-2 transition-transform group-hover:scale-105",
              isNational ? "ring-[#EE7115]/30" : "ring-[#52A2DF]/30",
            )}
          />
          <p className="mt-3 text-sm font-bold leading-tight text-gray-900 group-hover:text-[#52A2DF]">
            {member.name}
          </p>
          {isNational ? (
            <p className="mt-0.5 text-xs italic leading-snug text-gray-500">{member.domain}</p>
          ) : (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#52A2DF]">
              <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
              {node.label}
            </p>
          )}
        </button>
      ) : (
        <button type="button" onClick={onAssign} className="group flex flex-col items-center">
          <span
            className={clsx(
              avatarSize,
              "flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition-colors group-hover:border-[#52A2DF] group-hover:text-[#52A2DF]",
            )}
          >
            <PlusIcon aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-gray-400 group-hover:text-[#52A2DF]">
            {t("admin.reseau.vacant")}
          </p>
          {node.label && (
            <p className="mt-0.5 text-xs font-semibold text-gray-400">{node.label}</p>
          )}
        </button>
      )}
    </div>
  );
}
