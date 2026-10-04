// Local Imports
import { currentMember } from "../../currentMember";
import { ProfileHeader } from "./ProfileHeader";
import { Calendar } from "app/pages/Admin/Dashboard/RightPanel/Calendar";
import { TontineStatus } from "./TontineStatus";
import { TrainingsInProgress } from "./TrainingsInProgress";

// ----------------------------------------------------------------------

// Panneau de droite du dashboard membre : profil, calendrier (composant
// partagé avec l'admin — purement présentationnel, aucune donnée admin
// dedans, voir Admin/Dashboard/RightPanel/Calendar.jsx), cotisation du
// mois, formations en cours.
//
// "lg:sticky lg:top-0 lg:self-start" : la colonne principale (actualité,
// activités récentes, graphe, tableau comparatif...) est beaucoup plus
// longue que ce panneau — sans ça, le panneau défilerait avec le reste et
// disparaîtrait vers le haut dès qu'on avance dans la colonne principale.
// "self-start" est nécessaire en plus de "sticky" : par défaut un flex-row
// étire ses enfants à la même hauteur (ici celle, très grande, de la
// colonne principale), ce qui annule tout effet visible du "sticky" — on
// redonne au panneau sa hauteur naturelle (plus courte) pour qu'il puisse
// réellement "coller" en haut pendant le défilement. Seulement à partir de
// "lg" : en dessous, le panneau repasse sous le contenu principal
// (flex-col), où "sticky" n'aurait pas de sens. "max-h-screen
// overflow-y-auto" en filet de sécurité si le panneau devient un jour plus
// grand que l'écran (ex: ajout d'un futur widget) — pour qu'il reste
// entièrement consultable (avec son propre défilement interne) plutôt que
// coupé en bas sans moyen d'accéder au reste.
export function RightPanel() {
  return (
    <aside className="w-full shrink-0 border-black/5 bg-white p-6 lg:sticky lg:top-0 lg:w-[380px] lg:self-start lg:max-h-screen lg:overflow-y-auto lg:border-l lg:p-8">
      <ProfileHeader member={currentMember} />
      <div className="mt-6">
        <Calendar />
      </div>
      <TontineStatus />
      <TrainingsInProgress />
    </aside>
  );
}
