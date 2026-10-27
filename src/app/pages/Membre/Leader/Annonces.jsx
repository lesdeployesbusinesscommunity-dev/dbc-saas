// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { AnnouncementsManager } from "app/pages/Annonces/AnnouncementsManager";
import { useLeaderAudience } from "app/pages/Annonces/useAudience";
import { LeaderShell } from "./LeaderShell";

// ----------------------------------------------------------------------

// Onglet "Annonces" de l'Espace leader (/membre/leader/annonces) : le leader
// d'antenne écrit à SES membres — toute son antenne, un niveau de son antenne,
// ou des membres de son antenne choisis un par un — et retrouve ses annonces.
// L'annonce s'affiche dans le fil d'actualité et les notifications de ceux
// qu'elle vise.
export default function LeaderAnnonces() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const context = useLeaderAudience();

  return (
    <LeaderShell searchValue={query} onSearchChange={setQuery} searchPlaceholder={t("announcements.manage.search")}>
      <AnnouncementsManager context={context} query={query} />
    </LeaderShell>
  );
}
