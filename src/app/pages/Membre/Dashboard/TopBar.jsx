// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

// Local Imports
import { LanguageToggle } from "components/shared/LanguageToggle";
import { ProfileMenu } from "app/pages/Auth/ProfileMenu";
import { useSession } from "app/pages/Auth/session";
import { currentMember } from "../currentMember";
import { NotificationsBell } from "../components/NotificationsBell";

// ----------------------------------------------------------------------

// Titre de la page + barre de recherche, alignés dans la colonne
// principale — même motif que Admin/Dashboard/TopBar.jsx. Manquait dans
// la première version du dashboard membre (voir la maquette fournie).
//
// "titleKey" : réutilisée telle quelle par les autres pages de l'espace
// membre (voir Tontine/index.jsx) — seul le titre affiché change,
// "membre.dashboard.title" reste la valeur par défaut pour ne rien
// changer à l'appel existant sur le Dashboard. "titleExtra" (optionnel) :
// un nœud affiché juste après le titre — utilisé par "Ma Tontine" pour y
// mettre le badge de niveau cliquable (voir components/
// LevelSwitcherBadge.jsx), absent par défaut pour ne rien changer au
// Dashboard non plus.
//
// La recherche suit le principe de l'admin (voir Admin/components/
// AdminTopBar.jsx) : elle n'est plus décorative. Chaque page qui a quelque
// chose à chercher passe "searchValue"/"onSearchChange" (et un
// "searchPlaceholder" qui dit QUOI chercher sur cette page) et filtre
// elle-même ses listes avec ce texte (voir Formation/index.jsx,
// Tontine/index.jsx...). Une page sans rien à chercher (Paramètres, un
// simple formulaire) omet ces props : le champ ne s'affiche alors pas du
// tout, plutôt qu'une recherche qui ne ferait rien.
//
// À droite de la recherche : la langue, la cloche des notifications et le
// MENU DU PROFIL (photo + nom du membre, voir Auth/ProfileMenu.jsx) — on y
// trouve les Paramètres, "Passer en mode admin" pour un administrateur (un
// admin est d'abord un membre) et "Se déconnecter" (avec confirmation).
// Au-dessus du titre, la ligne dorée "Espace membre" reprend le motif de
// l'en-tête admin (voir Admin/components/AdminTopBar.jsx).
export function TopBar({
  titleKey = "membre.dashboard.title",
  titleExtra = null,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
}) {
  const { t } = useTranslation();
  const hasSearch = typeof onSearchChange === "function";
  const session = useSession();

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dbc-gold">
          {t("membre.topbar.eyebrow")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold italic text-gray-900">{t(titleKey)}</h1>
          {titleExtra}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        {hasSearch && (
          <label className="relative w-full max-w-md flex-1 sm:w-auto sm:flex-initial">
            <span className="sr-only">{searchPlaceholder ?? t("membre.topbar.searchPlaceholder")}</span>
            <MagnifyingGlassIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder ?? t("membre.topbar.searchPlaceholder")}
              className="w-full rounded-full border-0 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-[#52A2DF] sm:w-72 lg:w-80"
            />
          </label>
        )}

        <LanguageToggle />
        <NotificationsBell />
        <ProfileMenu
          ns="membre"
          name={currentMember.name}
          subtitle={currentMember.role}
          detail={currentMember.matricule}
          photo={currentMember.photo}
          settingsTo="/membre/parametres"
          switchTo={session?.canSwitchRole ? { role: "admin", to: "/admin/dashboard" } : null}
        />
      </div>
    </div>
  );
}
