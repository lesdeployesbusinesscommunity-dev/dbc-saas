// Import Dependencies
import { Outlet } from "react-router";

// Local Imports
import { Header } from "./Header";

// ----------------------------------------------------------------------

// PublicLayout = le "gabarit" utilisé par les pages accessibles à tout le
// monde (pas besoin d'être connecté). Contrairement au layout du dashboard,
// il n'a PAS de sidebar : juste un header en haut, et le contenu de la page
// en dessous (affiché via <Outlet /> = l'endroit où React Router insère la
// page correspondant à l'URL, ex: la page Visiteur).
export function PublicLayout() {
  return (
    <div className="flex min-h-100vh flex-col">
      {/* Header commun à toutes les pages publiques */}
      <Header />

      {/* Zone où s'affiche le contenu de la page active (ex: Visiteur) */}
      <main className="grow">
        <Outlet />
      </main>
    </div>
  );
}
