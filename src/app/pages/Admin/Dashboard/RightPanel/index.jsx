// Local Imports
import { currentAdmin } from "../mockData";
import { ProfileHeader } from "./ProfileHeader";
import { Calendar } from "./Calendar";
import { TontineBeneficiaries } from "./TontineBeneficiaries";
import { TrainingsCarousel } from "./TrainingsCarousel";

// ----------------------------------------------------------------------

// Panneau de droite du dashboard : profil admin, calendrier, bénéficiaires
// de la tontine du mois, formations en cours.
export function RightPanel() {
  return (
    <aside className="w-full shrink-0 border-black/5 bg-white p-6 lg:w-[380px] lg:border-l lg:p-8">
      <ProfileHeader admin={currentAdmin} />
      <div className="mt-6">
        <Calendar />
      </div>
      <TontineBeneficiaries />
      <TrainingsCarousel />
    </aside>
  );
}
