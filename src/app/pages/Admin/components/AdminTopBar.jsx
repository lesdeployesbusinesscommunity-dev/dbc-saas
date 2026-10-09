// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { LanguageToggle } from "components/shared/LanguageToggle";
import { ProfileMenu } from "app/pages/Auth/ProfileMenu";
import { NotificationsBell } from "app/pages/Notifications/NotificationsBell";
import { currentAdmin } from "../currentAdmin";

// ----------------------------------------------------------------------

// En-tête réutilisable des pages admin qui n'ont pas de panneau latéral
// dédié (contrairement au Dashboard) : titre de la page, recherche,
// notifications et identité admin sur une seule ligne. L'"eyebrow"
// au-dessus du titre reste la seule touche ajoutée ici — le motif
// géométrique (PatternStrip.jsx) a été retiré de la mise en page partagée
// après retour : il ne rendait pas bien à cette échelle, quel que soit
// l'endroit où on le plaçait. L'identité africaine du site se jouera
// plutôt sur du contenu réel (ex : la carte du réseau par pays dans
// Gestion du réseau) que sur des motifs décoratifs abstraits.
//
// La recherche n'est plus décorative : chaque page qui a quelque chose de
// pertinent à chercher (branches/responsables du réseau, formations,
// postes de gouvernance…) passe "searchValue"/"onSearchChange" (et
// idéalement "searchPlaceholder", sinon un texte générique) pour la
// piloter elle-même — voir Reseau/index.jsx, Formation/index.jsx,
// Gouvernance/index.jsx, Membres/index.jsx pour des exemples, chacun avec
// sa propre logique de correspondance. Une page qui n'a rien de sensé à
// chercher (ex: Paramètres, un simple formulaire de réglages ; Finance,
// qui n'a aucune liste d'éléments nommés) omet ces props : le champ ne
// s'affiche alors pas du tout, plutôt que d'afficher une recherche qui ne
// ferait rien.
//
// Le profil admin (photo + nom, tout à droite) ouvre un menu : Paramètres,
// "Passer en mode membre" (un admin est d'abord un membre) et "Se
// déconnecter", avec confirmation (voir Auth/ProfileMenu.jsx).
export function AdminTopBar({ title, searchValue, onSearchChange, searchPlaceholder }) {
  const { t } = useTranslation();
  const hasSearch = typeof onSearchChange === "function";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dbc-gold">
          {t("admin.topbar.eyebrow")}
        </p>
        <h1 className="mt-1 text-lg font-bold italic text-gray-900">{title}</h1>
      </div>

      {hasSearch && (
        <label className="relative w-full max-w-md flex-1 sm:flex-initial">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder ?? t("admin.topbar.searchPlaceholder")}
            className="w-full rounded-full border-0 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-[#52A2DF]"
          />
        </label>
      )}

      <div className="flex items-center gap-3">
        <LanguageToggle />
        <NotificationsBell space="admin" />
        <ProfileMenu
          ns="admin"
          name={currentAdmin.name}
          subtitle={currentAdmin.role}
          photo={currentAdmin.photo}
          settingsTo="/admin/parametres"
          switchTo={{ role: "membre", to: "/membre/dashboard" }}
        />
      </div>
    </div>
  );
}
