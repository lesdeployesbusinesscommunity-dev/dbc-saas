// Import Dependencies
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { Page } from "components/shared/Page";
import { AdminTopBar } from "../components/AdminTopBar";
import { NotificationsList } from "app/pages/Notifications/NotificationsList";
import { RequestCard } from "./RequestCard";

// ----------------------------------------------------------------------

// Page "Notifications" de l'espace admin (/admin/notifications) : les
// DEMANDES des membres à traiter (suppression de compte, niveau sollicité,
// participation à une rencontre, échange de Coins, suite de tontine) avec,
// pour chacune, le profil du membre, "Valider", "Refuser" et "Écrire un
// mail" ; puis les alertes de la plateforme (nouveaux membres à valider,
// cotisations du mois, retards, tour de tontine). Les alertes affichées
// suivent la colonne "Administrateurs" de Paramètres > Notifications.
export default function AdminNotifications() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  return (
    <Page title={`Admin – ${t("admin.nav.notifications")}`}>
      <div className="p-6 lg:p-8">
        <AdminTopBar
          title={t("admin.nav.notifications")}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder={t("notifications.searchPlaceholder")}
        />
        <div className="mt-6">
          <NotificationsList
            space="admin"
            query={query}
            renderItem={(item) => (item.kind === "request" ? <RequestCard item={item} /> : null)}
          />
        </div>
      </div>
    </Page>
  );
}
