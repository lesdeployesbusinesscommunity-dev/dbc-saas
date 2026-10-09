// Import Dependencies
import { NotificationsBell as SharedBell } from "app/pages/Notifications/NotificationsBell";

// ----------------------------------------------------------------------

// Cloche de l'en-tête membre : la cloche commune aux deux espaces (voir
// Notifications/NotificationsBell.jsx), branchée sur le fil du membre.
export function NotificationsBell() {
  return <SharedBell space="membre" />;
}
