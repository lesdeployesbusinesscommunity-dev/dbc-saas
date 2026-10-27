// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { AnnouncementsManager } from "app/pages/Annonces/AnnouncementsManager";
import { useAdminAudience } from "app/pages/Annonces/useAudience";
import { AdminTopBar } from "../components/AdminTopBar";

// ----------------------------------------------------------------------

// Page "Annonces" de l'espace admin (/admin/annonces) : publier une annonce qui
// s'affiche dans le fil d'actualité des membres concernés et dans leurs
// notifications, et suivre ce qui a été publié, y compris par les leaders
// d'antenne. L'administration peut viser tous les membres, un ou plusieurs
// niveaux, des groupes de tontine, une antenne, les leaders, ou des membres
// choisis un par un (voir Annonces/audience.js). Les annonces de l'administration
// défilent aussi dans le carrousel de l'accueil des membres, avec leur flyer.
export default function AdminAnnonces() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const context = useAdminAudience();

  return (
    <Page title={`Admin – ${t("admin.nav.annonces")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.nav.annonces")}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("announcements.manage.search")}
        />
        <div className="mt-6">
          <AnnouncementsManager context={context} query={query} />
        </div>
      </div>
    </Page>
  );
}
