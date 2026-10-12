// Local Imports
import { ProfileMenu } from "app/pages/Auth/ProfileMenu";
import { NotificationsBell } from "app/pages/Notifications/NotificationsBell";

// ----------------------------------------------------------------------

// En-tête du panneau de droite : la cloche des notifications et le MENU DU
// PROFIL de l'admin connecté (Paramètres, "Passer en mode membre", "Se
// déconnecter" avec confirmation — le même que dans l'en-tête des autres
// pages admin, voir Admin/components/AdminTopBar.jsx). Le dashboard n'a pas
// d'en-tête à droite : c'est ici que ces deux éléments se trouvent.
export function ProfileHeader({ admin }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <NotificationsBell space="admin" />
      <ProfileMenu
        ns="admin"
        name={admin.name}
        subtitle={admin.role}
        photo={admin.photo}
        settingsTo="/admin/parametres"
        switchTo={{ role: "membre", to: "/membre/dashboard" }}
      />
    </div>
  );
}
