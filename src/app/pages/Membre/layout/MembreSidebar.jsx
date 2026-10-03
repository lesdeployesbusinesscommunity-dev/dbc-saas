// Import Dependencies
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { memberNavItems, memberSettingsItem } from "../memberNav";

// ----------------------------------------------------------------------

function NavItem({ item }) {
  const { t } = useTranslation();
  const { labelKey, to, Icon } = item;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
          isActive
            ? "bg-[#EE7115]/[0.1] text-[#EE7115]"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          <span className="truncate">{t(labelKey)}</span>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-y-2 -right-3 w-1 rounded-full bg-[#EE7115]"
            />
          )}
        </>
      )}
    </NavLink>
  );
}

// Barre latérale de l'espace membre — même structure que la sidebar
// admin (voir Admin/layout/AdminSidebar.jsx) : liseré doré en haut, logo
// + nom du site, menu de navigation, mêmes couleurs de marque. Pas
// d'entrée "Paramètres" fixée en bas pour l'instant (aucune page réglages
// membre demandée) ; à ajouter de la même façon que côté admin si besoin
// plus tard.
//
// "sticky top-0 h-screen" (plutôt que seulement "h-full" dans le flex
// parent) : le dashboard a beaucoup grandi (activités, graphe, tableau
// comparatif...) et dépasse maintenant la hauteur de l'écran, donc la
// page défile. "sticky" garde la sidebar à l'écran pendant ce défilement
// au lieu de la laisser remonter avec le reste — elle reste à sa place
// quel que soit le conteneur qui finit par défiler. "overflow-y-auto" sur
// la nav elle-même est un filet de sécurité si la liste de pages devient
// un jour trop longue pour la hauteur de l'écran.
export function MembreSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#EE7115] via-dbc-gold to-[#EE7115]" />

      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        <div className="flex items-center gap-3 px-2">
          <img
            src="/logo-icon.jpg"
            alt="Logo DBC"
            className="h-11 w-auto shrink-0 object-contain"
          />
          <p className="text-sm font-bold leading-tight text-[#EE7115]">
            Les Déployés
            <br />
            Business Community
          </p>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-dbc-gold/60 via-dbc-gold/10 to-transparent" />

        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          {memberNavItems.map((item) => (
            <NavItem key={item.key} item={item} />
          ))}
        </nav>

        <div className="mt-auto pt-4">
          <NavItem item={memberSettingsItem} />
        </div>
      </div>
    </aside>
  );
}
