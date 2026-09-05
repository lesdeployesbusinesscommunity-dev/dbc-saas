// Import Dependencies
import { Outlet } from "react-router";

// Local Imports
import { PublicHeader } from "components/shared/PublicHeader";
import { PublicFooter } from "components/shared/PublicFooter";

// ----------------------------------------------------------------------

// PublicLayout = le "gabarit" utilisé par les pages accessibles à tout le
// monde (pas besoin d'être connecté). Contrairement au layout du dashboard,
// il n'a PAS de sidebar : juste un header en haut, le contenu de la page
// au milieu (affiché via <Outlet /> = l'endroit où React Router insère la
// page correspondant à l'URL, ex: la page Visiteur), et un footer commun
// en bas.
export function PublicLayout() {
  return (
    <div className="flex min-h-100vh flex-col bg-white">
      {/* Header commun à toutes les pages publiques (déplacé dans
          components/shared pour être réutilisable sur d'autres layouts) */}
      <PublicHeader />

      {/* Zone où s'affiche le contenu de la page active (ex: Visiteur).
          bg-white forcé ici : sans ça, si le mode sombre du tableau de
          bord est actif (togglé ailleurs dans l'admin), le fond noir du
          thème remontait derrière nos sections publiques qui n'ont pas
          leur propre couleur de fond. */}
      <main className="grow bg-white">
        <Outlet />
      </main>

      {/* Footer commun à toutes les pages publiques */}
      <PublicFooter />
    </div>
  );
}
