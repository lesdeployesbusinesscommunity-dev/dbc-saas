// Import Dependencies
import { useTranslation } from "react-i18next";
import { CircleStackIcon, TrophyIcon } from "@heroicons/react/24/solid";

// Local Imports
import { getCoinsStats } from "./mockData";

// ----------------------------------------------------------------------

// "Mes DBC Coins" : même dégradé bleu que la bannière "Cagnotte du mois"
// de Ma Tontine (voir Tontine/CagnotteHero.jsx : "from-[#52A2DF] to-
// [#3d6fb0]", repris tel quel plutôt qu'un nouveau dégradé), avec en plus
// un effet de vagues qui donne l'impression d'un bassin à moitié rempli
// de pièces — demandé explicitement. Les vagues sont purement décoratives
// ("comme si" il y avait un remplissage) : aucune cible/plafond de coins
// n'a été donné, donc rien n'est calculé à partir du solde pour fixer un
// niveau de remplissage réel — ce serait inventer une donnée. Deux vagues
// superposées (arrière plus lente et plus transparente, avant plus
// rapide et plus opaque) défilent en boucle via "background-position"
// plutôt que du JS, pour rester léger ; l'animation est définie dans un
// <style> scopé à ce composant plutôt que dans la config Tailwind
// globale, pour ne pas affecter le reste du site pour un seul effet
// ponctuel.
// Hauteur du viewBox déjà mise à l'échelle de la hauteur réelle en pixels
// du bandeau ("h-24" = 96, "h-20" = 80) plutôt qu'un viewBox "rond" (ex:
// 320) redimensionné ensuite par "background-size" : un SVG utilisé comme
// image de fond, étiré sur un seul axe par "background-size" (ex:
// "1440px 100%" avec un viewBox 320 de haut écrasé à 96px), s'affiche
// tronqué sur une partie de la largeur dans Chromium — bug reproduit et
// vérifié avant ce choix. En pré-calculant le viewBox à la bonne hauteur,
// "background-size" n'a plus qu'à recopier les pixels 1:1, sans étirement,
// et s'affiche correctement sur toute la largeur.
const WAVE_BACK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='96' viewBox='0 0 1440 96'%3E%3Cpath fill='rgba(255,255,255,0.28)' d='M0,48L60,51.2C120,54.3,240,60.9,360,57.6C480,54.3,600,41.7,720,40C840,38.4,960,48,1080,52.8C1200,57.6,1320,57.6,1380,57.6L1440,57.6L1440,96L0,96Z'%3E%3C/path%3E%3C/svg%3E\")";
const WAVE_FRONT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='80' viewBox='0 0 1440 80'%3E%3Cpath fill='rgba(255,255,255,0.42)' d='M0,48L80,45.3C160,42.8,320,37.3,480,38.7C640,40,800,48,960,49.3C1120,50.8,1280,45.3,1360,42.7L1440,40L1440,80L0,80Z'%3E%3C/path%3E%3C/svg%3E\")";

export function CoinsHero() {
  const { t } = useTranslation();
  const stats = getCoinsStats();

  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#52A2DF] to-[#3d6fb0] p-8 sm:p-10">
      <style>{`
        @keyframes dbc-wave-back { from { background-position-x: 0; } to { background-position-x: -1440px; } }
        @keyframes dbc-wave-front { from { background-position-x: 0; } to { background-position-x: 1440px; } }
        .dbc-wave-back { animation: dbc-wave-back 18s linear infinite; }
        .dbc-wave-front { animation: dbc-wave-front 11s linear infinite; }
      `}</style>

      <div
        aria-hidden="true"
        className="dbc-wave-back pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24"
        style={{ backgroundImage: WAVE_BACK, backgroundRepeat: "repeat-x", backgroundSize: "1440px 96px" }}
      />
      <div
        aria-hidden="true"
        className="dbc-wave-front pointer-events-none absolute inset-x-0 bottom-0 z-0 h-20"
        style={{ backgroundImage: WAVE_FRONT, backgroundRepeat: "repeat-x", backgroundSize: "1440px 80px" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70">
          <CircleStackIcon aria-hidden="true" className="size-4" />
          {t("membre.coins.hero.title")}
        </p>

        <p className="mt-3 flex items-center gap-3 text-5xl font-black text-white sm:text-6xl">
          <CircleStackIcon aria-hidden="true" className="size-10 text-white/90 sm:size-12" />
          {stats.balance}
        </p>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
          <TrophyIcon aria-hidden="true" className="size-4 text-[#FBBF24]" />
          {t("membre.coins.hero.communityRank", { rank: stats.communityRank })}
        </p>
      </div>
    </div>
  );
}
