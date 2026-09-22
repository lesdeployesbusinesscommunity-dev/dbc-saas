// Import Dependencies
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowPathIcon, ExclamationCircleIcon, UserIcon } from "@heroicons/react/24/solid";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { reseauGlobal } from "api/reseauMlm";

// ----------------------------------------------------------------------

// Page "Gestion du réseau" (/admin/reseau) : arbre de parrainage réel
// (GET /reseau-mlm/reseau-global). Contrairement à l'ancienne maquette
// (arbre par pays, avec "leader"/"coordinateur" par ville), le backend ne
// modélise ni le pays ni ces rôles sur un membre — seulement la chaîne de
// parrainage (qui a parrainé qui) et le niveau. Cette version affiche donc
// un seul arbre global, matricule + niveau par nœud, plutôt que d'inventer
// un découpage géographique qui n'existe pas dans les données.

function buildForest(nodes) {
  const byId = new Map(nodes.map((n) => [n.memberId, { ...n, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parentMemberId && byId.has(node.parentMemberId)) {
      byId.get(node.parentMemberId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex size-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
            aria-label={expanded ? "Réduire" : "Développer"}
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#52A2DF]/[0.1] text-[#52A2DF]">
          <UserIcon aria-hidden="true" className="size-4" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800">{node.membershipNumber}</p>
          <p className="truncate text-xs text-gray-500">{node.levelName}</p>
        </div>
      </div>

      {hasChildren && expanded && (
        <ul className="ml-2.5 mt-2 space-y-2 border-l border-gray-200 pl-5">
          {node.children.map((child) => (
            <TreeNode key={child.memberId} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Reseau() {
  const [nodes, setNodes] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const charger = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await reseauGlobal();
      setNodes(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const forest = useMemo(() => buildForest(nodes), [nodes]);

  return (
    <Page title="Admin – Réseau">
      <div className="p-6 lg:p-8">
        <AdminTopBar title="Réseau" />

        <p className="mt-4 text-sm text-gray-500">
          Arbre de parrainage complet ({nodes.length} membre{nodes.length > 1 ? "s" : ""}).
        </p>

        {status === "loading" && (
          <div className="mt-10 flex items-center justify-center text-gray-400">
            <ArrowPathIcon aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <ExclamationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            Impossible de charger le réseau pour le moment.
          </div>
        )}

        {status === "ready" && forest.length === 0 && (
          <p className="mt-8 rounded-2xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
            Aucun membre parrainé pour l&apos;instant.
          </p>
        )}

        {status === "ready" && forest.length > 0 && (
          <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <ul className="space-y-3">
              {forest.map((root) => (
                <TreeNode key={root.memberId} node={root} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Page>
  );
}
