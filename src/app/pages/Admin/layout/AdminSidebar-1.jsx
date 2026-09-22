// Import Dependencies
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Local Imports
import { adminNavItems, adminSettingsItem } from "../adminNav";

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

// Barre latérale de l'espace admin : logo + nom du site en haut, menu de
// navigation au centre, "Paramètres" toujours affiché en bas (séparé du
// reste par "mt-auto"). Visible à partir de "lg" ; sur petit écran, la
// priorité a été donnée à la fidélité de la maquette (desktop) — un mode
// mobile dédié (sidebar en tiroir) pourra être ajouté dans un second temps.
//
// Le liseré dégradé orange → or tout en haut, et le trait doré sous le
// bloc logo, sont la touche d'identité : discrets, en une seule teinte
// continue plutôt qu'un motif à motifs multiples (un vrai motif textile a
// besoin de plus d'espace pour se lire correctement — réservé à une
// bannière plus large, voir PatternStrip.jsx, plutôt qu'à une bordure de
// quelques pixels de haut).
export function AdminSidebar() {
  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#EE7115] via-dbc-gold to-[#EE7115]" />

      <div className="flex flex-1 flex-col px-5 py-6">
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
          {adminNavItems.map((item) => (
            <NavItem key={item.key} item={item} />
          ))}
        </nav>

        <div className="mt-auto pt-4">
          <NavItem item={adminSettingsItem} />
        </div>
      </div>
    </aside>
  );
}
