// Import Dependencies
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// Local Imports
import { currentMember } from "../currentMember";
import { NewsCarousel } from "./NewsCarousel";
import { getNewsSlides } from "./newsData";

// ----------------------------------------------------------------------

// Bandeau de bienvenue du dashboard membre : fond blanc, message de
// bienvenue et, à la place de l'ancienne illustration "Afrique" (toujours
// utilisée sur la page d'inscription), le carrousel d'actualités de la DBC
// (voir NewsCarousel.jsx / newsData.js).
//
// Le carrousel n'est pas une carte posée DANS le bandeau : il en fait
// partie. Le bandeau n'a donc pas de marge intérieure (le message a la
// sienne), la photo touche ses bords (le bandeau arrondi la découpe) et se
// fond dans le blanc côté message.
//
// À partir de 1800 px de large le carrousel est à droite du message, comme
// l'illustration avant lui. En dessous, la colonne principale est trop
// étroite pour les deux côte à côte (le panneau de droite du dashboard prend
// déjà 380 px) : le carrousel passe sous le message, sur toute la largeur du
// bandeau, et la photo se fond dans le blanc par le haut. Si ce seuil
// change, le changer aussi dans NewsCarousel.jsx ("min-[1800px]").
export function WelcomeBanner() {
  const { t } = useTranslation();
  // Les niveaux du membre ne changent pas pendant la visite : les
  // diapositives sont calculées une seule fois.
  const slides = useMemo(() => getNewsSlides(currentMember.levelKeys), []);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm min-[1800px]:flex min-[1800px]:min-h-[18rem]">
      <div className="min-w-0 p-6 sm:p-8 min-[1800px]:flex-1 min-[1800px]:self-center min-[1800px]:p-10">
        <p className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t("membre.dashboard.welcome.greeting")}{" "}
          <span className="text-[#EE7115]">{currentMember.name}</span>
        </p>
        <p className="mt-2 max-w-md text-sm italic text-gray-500 sm:text-base">
          {t("membre.dashboard.welcome.subtitle")}
        </p>
      </div>

      <NewsCarousel
        slides={slides}
        className="h-72 w-full shrink-0 min-[1800px]:h-auto min-[1800px]:w-[38rem]"
      />
    </div>
  );
}
