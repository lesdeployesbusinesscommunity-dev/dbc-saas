// Import Dependencies
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@heroicons/react/24/solid";

// Local Imports
import { NodeCard } from "./NodeCard";
import { resolveLevelLabel } from "./mockData";
import "./orgTree.css";

// ----------------------------------------------------------------------

// Un nœud de l'arbre + son propre sous-arbre. Le rond bleu "+" (ajouter une
// branche) est toujours affiché, quelle que soit la profondeur — il n'y a
// plus de dernier échelon fixe : l'admin peut empiler autant de branches
// qu'il veut (voir le popover "Ajouter une branche", qui permet aussi
// d'insérer une nouvelle branche au-dessus d'une branche existante plutôt
// que juste en dessous).
function TreeNode({ node, depth, levelTitles, onAssign, onAddChild, onRenameLevel, onViewMember }) {
  const { t } = useTranslation();
  // Le badge affiche le TITRE DE RÔLE de cet échelon (ex: "Le Visionnaire",
  // "Responsable Régional"), pas le nom propre de la branche — celui-ci
  // (ex: "Centre", "Littoral") est affiché juste en dessous de l'avatar
  // (voir NodeCard.jsx). Le titre de rôle est commun à toutes les branches
  // de même profondeur dans ce pays et peut être renommé en cliquant
  // dessus ; tant qu'il n'a pas encore été nommé, il retombe sur un
  // libellé générique (resolveLevelLabel, dans mockData.js).
  const levelLabel = resolveLevelLabel(depth, levelTitles, t);

  return (
    <li>
      <NodeCard
        node={node}
        depth={depth}
        levelLabel={levelLabel}
        onAssign={() => onAssign(node, depth)}
        onRenameLevel={(title) => onRenameLevel(depth, title)}
        onViewMember={() => onViewMember(node, depth)}
      />

      <div className="dbc-tree-stem">
        <button
          type="button"
          onClick={() => onAddChild(node, depth)}
          aria-label={t("admin.reseau.addBranch")}
          title={t("admin.reseau.addBranch")}
          className="dbc-tree-add-btn flex size-8 items-center justify-center rounded-full bg-[#52A2DF] text-white shadow-md ring-4 ring-white transition-transform hover:scale-110 hover:bg-[#3d8bc9]"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </button>
      </div>

      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              levelTitles={levelTitles}
              onAssign={onAssign}
              onAddChild={onAddChild}
              onRenameLevel={onRenameLevel}
              onViewMember={onViewMember}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Arbre généalogique du réseau d'un pays. "onAssign(node, depth)" est
// appelé quand on clique sur un poste vacant (assigner un membre déjà
// existant, sans créer de nouvelle branche) ; "onAddChild(node, depth)"
// quand on clique sur un rond "+" (créer une nouvelle branche enfant de
// "node", avec son nom + le membre qui l'occupe — voir Reseau/index.jsx) ;
// "onRenameLevel(depth, title)" quand on clique sur le badge d'une carte
// pour renommer le titre de rôle de tout un échelon ; "onViewMember(node,
// depth)" quand on clique sur un poste déjà pourvu, pour ouvrir la fiche
// complète de son responsable.
export function OrgTree({ root, levelTitles, onAssign, onAddChild, onRenameLevel, onViewMember }) {
  return (
    <div className="dbc-tree">
      <ul>
        <TreeNode
          node={root}
          depth={0}
          levelTitles={levelTitles}
          onAssign={onAssign}
          onAddChild={onAddChild}
          onRenameLevel={onRenameLevel}
          onViewMember={onViewMember}
        />
      </ul>
    </div>
  );
}
