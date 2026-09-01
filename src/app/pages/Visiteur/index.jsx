// Local Imports
import { Link } from "react-router";
import { Page } from "components/shared/Page";
import { Stats } from "./Stats";
import { AboutDbc } from "./AboutDbc";
import { Profiles } from "./Profiles";

// ----------------------------------------------------------------------

// Page Visiteur = la page publique visible à /accueil (non connecté).
// Elle enchaîne : hero (accroche + image d'Afrique), Statistiques,
// La DBC (vision/mission + 6 valeurs), puis les 3 profils de membres.
export default function Visiteur() {
  return (
    <Page title="Accueil">
      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center justify-items-center gap-6 lg:grid-cols-2 lg:justify-items-stretch">
          {/* Colonne texte */}
          <div className="relative">
            {/* Petite décoration au-dessus du titre */}
            <img
              src="/deco.png"
              alt=""
              aria-hidden="true"
              className="mb-2 h-10 w-10"
            />

            {/* leading-normal = plus d'interligne entre les 3 lignes du titre */}
            <h1 className="text-4xl font-extrabold mb-1 text-gray-900 transition-all duration-300 ease-out hover:scale-105 sm:text-5xl">
              Rejoignez le
              {/* <br />
              <span className="text-[#EE7115]">Premier Écosystème</span>
              <br />
              Business Panafricain */}
            </h1>
            <h1 className="text-4xl font-extrabold mb-1 text-gray-900 transition-all duration-300 ease-out hover:scale-105 sm:text-5xl">
              {/* Rejoignez le
              <br /> */}
              <span className="text-[#EE7115]">Premier Écosystème</span>
              {/* <br />
              Business Panafricain */}
            </h1>
            <h1 className="text-4xl font-extrabold text-gray-900 transition-all duration-300 ease-out hover:scale-105 sm:text-5xl">
              {/* Rejoignez le
              <br />
              <span className="text-[#EE7115]">Premier Écosystème</span>
              <br /> */}
              Business Panafricain
            </h1>

            <p className="mt-4 max-w-md text-sm font-light text-gray-500">
              Équiper · Connecter · Financer les entrepreneurs africains pour
              créer une richesse durable.
            </p>

            {/* Boutons d'action : contour + fond à 32% d'opacité.
                Note : l'opacité arbitraire doit être écrite avec des
                crochets ("/[0.32]") et non juste "/32" — Tailwind ne
                génère la classe que si la valeur d'opacité existe dans son
                échelle prédéfinie (0,5,10,20,25,30...), sinon rien ne
                s'affiche silencieusement. */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/inscription"
                className="rounded-lg border border-[#EE7115] bg-[#EE7115]/[0.32] px-5 py-2.5 text-sm font-semibold text-[#EE7115]"
              >
                Rejoins la DBC
              </Link>

              <Link
                to="/niveaux"
                className="rounded-lg border border-[#52A2DF] bg-[#52A2DF]/[0.32] px-5 py-2.5 text-sm font-semibold text-[#52A2DF]"
              >
                Voir les niveaux
              </Link>
            </div>

            {/* Flèche décorative qui pointe vers l'image d'Afrique */}
            {/* <img
              src="/fleche.png"
              alt=""
              aria-hidden="true"
              className="absolute -right-4 top-8 hidden h-16 w-16 lg:block"
            /> */}
          </div>

          {/* Colonne image (centrée dans sa colonne, plus proche du texte).
              transition-transform + hover:scale = l'image s'agrandit
              légèrement au survol de la souris. */}
          <div className="flex justify-center">
            <img
              src="/Afrique.png"
              alt="Carte d'affaires en Afrique"
              className="w-full max-w-sm cursor-pointer transition-transform duration-300 ease-out hover:scale-110"
            />
          </div>
        </div>
      </section>

      <Stats />
      <AboutDbc />
      <Profiles />
    </Page>
  );
}
