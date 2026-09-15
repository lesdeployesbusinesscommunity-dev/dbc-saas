// Import Dependencies
import { Navigate, useOutlet } from "react-router";

// Local Imports
import { useAuthContext } from "app/contexts/auth/context";
import { HOME_PATH, REDIRECT_URL_KEY } from "constants/app.constant";

// ----------------------------------------------------------------------


export default function GhostGuard() {
  const outlet = useOutlet();
  const { isAuthenticated } = useAuthContext();

  // Bug corrigé : avant, `${new URLSearchParams(...).get(...)}` transformait
  // l'absence du paramètre "redirect" (null) en la CHAÎNE "null" (4
  // caractères, donc "truthy" et différente de ""), ce qui déclenchait
  // <Navigate to="null" /> à chaque fois qu'on arrivait sur /login déjà
  // connecté sans paramètre "redirect" dans l'URL — une route "null" qui
  // n'existe évidemment nulle part, d'où la page 404. On utilise maintenant
  // directement .get(), qui renvoie null (pas la chaîne "null") en son
  // absence, et on retombe alors bien sur HOME_PATH.
  const url = new URLSearchParams(window.location.search).get(REDIRECT_URL_KEY);

  if (isAuthenticated) {
    if (url && url !== "") {
      return <Navigate to={url} />;
    }
    return <Navigate to={HOME_PATH} />;
  }

  return <>{outlet}</>;
}
