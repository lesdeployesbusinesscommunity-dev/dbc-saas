// Import Dependencies
import { Navigate, useLocation, useOutlet } from "react-router";

// Local Imports
import { getAdminSecret } from "api/adminHeaders";
import { ADMIN_ENTRY_PATH, REDIRECT_URL_KEY } from "constants/app.constant";

// ----------------------------------------------------------------------

// Protection interim du back-office (/admin), distincte de AuthGuard (qui
// protege les pages membres via JWT). Le backend ne verifie ici qu'un
// secret partage (x-admin-secret) — voir api/adminHeaders.js — donc ce
// garde ne fait que le meme controle cote client pour eviter d'afficher
// l'UI admin sans secret enregistre ; le vrai controle reste cote backend.
export default function AdminSecretGuard() {
  const outlet = useOutlet();
  const location = useLocation();

  if (!getAdminSecret()) {
    return (
      <Navigate
        to={`${ADMIN_ENTRY_PATH}?${REDIRECT_URL_KEY}=${location.pathname}`}
        replace
      />
    );
  }

  return <>{outlet}</>;
}
