// Import Dependencies
import { NodeCard } from "./NodeCard";
import "./orgTree.css";

// ----------------------------------------------------------------------

// Un nœud de l'arbre + son propre sous-arbre.
function TreeNode({ node, depth, onViewMember, searchMatches }) {
  // "searchMatches" (voir getTreeSearchMatches, calculé par
  // Reseau/index.jsx) est null quand aucune recherche n'est en cours ->
  // rendu normal. Sinon, un nœud est soit un résultat direct ("match", mis
  // en évidence), soit gardé visible normalement parce qu'il mène à un
  // résultat ou en descend ("keepIds" sans être dans "matchIds"), soit
  // estompé (ni l'un ni l'autre) pour que les résultats ressortent.
  const matchState = !searchMatches
    ? undefined
    : searchMatches.matchIds.has(node.id)
      ? "match"
      : searchMatches.keepIds.has(node.id)
        ? undefined
        : "dim";

  return (
    <li>
      <NodeCard node={node} depth={depth} onViewMember={() => onViewMember(node, depth)} matchState={matchState} />

      {node.children.length > 0 && (
        <>
          <div className="dbc-tree-stem" />
          <ul>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onViewMember={onViewMember}
                searchMatches={searchMatches}
              />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

// Arbre (en réalité une forêt : voir Reseau/index.jsx, plusieurs racines
// possibles par pays) de parrainage réel d'un pays. "onViewMember(node,
// depth)" est appelé au clic sur une carte, pour ouvrir la fiche complète
// de son titulaire. "searchMatches" (calculé par Reseau/index.jsx) met en
// évidence/estompe les cartes selon la recherche en cours dans
// AdminTopBar — null quand il n'y a pas de recherche.
export function OrgTree({ roots, onViewMember, searchMatches = null }) {
  return (
    <div className="dbc-tree">
      <ul className="dbc-tree-forest">
        {roots.map((root) => (
          <TreeNode key={root.id} node={root} depth={0} onViewMember={onViewMember} searchMatches={searchMatches} />
        ))}
      </ul>
    </div>
  );
}
