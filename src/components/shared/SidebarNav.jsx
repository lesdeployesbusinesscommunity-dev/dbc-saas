// Import Dependencies
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Le menu des barres latérales (admin et membre) : des pages seules, et des
// CATÉGORIES qui regroupent plusieurs pages et se déplient / se replient d'un
// clic (flèche vers le bas = repliée, vers le haut = dépliée), pour que le menu
// reste aéré. "entries" est une liste dont chaque élément est soit une page
// { key, labelKey, to, Icon }, soit une catégorie { key, labelKey, Icon, items: [pages] }.
//
// - La catégorie qui contient la page ouverte s'ouvre toute seule, et elle est
//   mise en couleur quand elle est repliée.
// - Le choix de chacun (dépliée / repliée) est retenu dans le navigateur
//   ("storageKey") ; sans stockage, le menu marche quand même.
// - "renderBadge(page)" : la pastille d'une page (non lues, demandes...).
//   "badgeCounts" : { cléDePage: nombre } ; une catégorie repliée montre une
//   pastille si une de ses pages en a une, pour qu'une alerte ne se cache pas.

const isInside = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

function readOpen(storageKey) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

function writeOpen(storageKey, value) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // stockage indisponible : le choix vaut pour cette visite seulement
  }
}

function PageLink({ item, renderBadge, nested }) {
  const { t } = useTranslation();
  const { labelKey, to, Icon } = item;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "relative flex items-center rounded-xl text-sm font-semibold transition-colors",
          nested ? "gap-2.5 px-2.5 py-2.5" : "gap-3 px-4 py-3",
          isActive ? "bg-[#EE7115]/[0.1] text-[#EE7115]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span className="truncate">{t(labelKey)}</span>
          {renderBadge?.(item)}
          {isActive && <span aria-hidden="true" className="absolute inset-y-2 -right-3 w-1 rounded-full bg-[#EE7115]" />}
        </>
      )}
    </NavLink>
  );
}

function Category({ group, open, onToggle, active, pending, renderBadge }) {
  const { t } = useTranslation();
  const { Icon } = group;
  const panelId = `nav-group-${group.key}`;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={clsx(
          "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors",
          active && !open ? "text-[#EE7115]" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        )}
      >
        <Icon aria-hidden="true" className={clsx("size-5 shrink-0", active ? "text-[#EE7115]" : "text-gray-400")} />
        <span className="min-w-0 flex-1 leading-snug">{t(group.labelKey)}</span>
        {!open && pending > 0 && (
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-[#EE7115]" />
        )}
        {open ? (
          <ChevronUpIcon aria-hidden="true" className="size-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <div id={panelId} className="ml-5 mt-1 flex flex-col gap-1 border-l border-gray-100 pl-1.5">
          {group.items.map((item) => (
            <PageLink key={item.key} item={item} renderBadge={renderBadge} nested />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ entries, storageKey, renderBadge, badgeCounts = {}, className }) {
  const { pathname } = useLocation();
  const [saved, setSaved] = useState(() => readOpen(storageKey));

  const groupOf = (group) => group.items.some((item) => isInside(pathname, item.to));

  // Ouvre la catégorie de la page affichée (arrivée par un lien, une notification...).
  useEffect(() => {
    const current = entries.find((entry) => entry.items && groupOf(entry));
    if (current && saved[current.key] !== true) {
      setSaved((previous) => {
        const next = { ...previous, [current.key]: true };
        writeOpen(storageKey, next);
        return next;
      });
    }
    // seulement quand la page change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggle = (key) =>
    setSaved((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      writeOpen(storageKey, next);
      return next;
    });

  return (
    <nav className={clsx("flex flex-col gap-1.5", className)}>
      {entries.map((entry) =>
        entry.items ? (
          <Category
            key={entry.key}
            group={entry}
            open={saved[entry.key] === true}
            onToggle={() => toggle(entry.key)}
            active={groupOf(entry)}
            pending={entry.items.reduce((sum, item) => sum + (badgeCounts[item.key] ?? 0), 0)}
            renderBadge={renderBadge}
          />
        ) : (
          <PageLink key={entry.key} item={entry} renderBadge={renderBadge} />
        ),
      )}
    </nav>
  );
}
