// Import Dependencies
import { createContext, useContext, useMemo, useState } from "react";

// Local Imports
import { currentMember } from "../currentMember";
import { useMemberData } from "../memberStore";
import { getSessionSnapshot } from "app/pages/Auth/session";

// ----------------------------------------------------------------------

// Un membre peut cotiser à plusieurs niveaux DBC en même temps (ex: 5 000
// F/mois au niveau Starter ET 10 000 F/mois au niveau Bâtisseur) — voir
// "levelKeys" dans currentMember.js. Ce contexte retient le niveau
// actuellement consulté ("activeLevelKey") et l'expose à toutes les pages
// de l'espace membre (voir MembreLayout.jsx, qui enveloppe tout
// /membre/... avec ce provider), pour que changer de niveau depuis le
// badge de la carte de profil (voir Dashboard/ProfileSummaryCard.jsx)
// mette aussi à jour la cotisation du mois, les formations en cours, et
// toute future page qui dépend du niveau — une seule source de vérité au
// lieu d'un état local par page.
const MemberLevelContext = createContext(null);

export function MemberLevelProvider({ children }) {
  const { version } = useMemberData();
  // Au départ : le niveau choisi sur l'écran de connexion s'il fait partie
  // des niveaux du membre, sinon le premier.
  const [chosenLevelKey, setActiveLevelKey] = useState(() => {
    const selected = getSessionSnapshot().session?.user?.selectedLevelKey;
    return currentMember.levelKeys.includes(selected) ? selected : currentMember.levelKeys[0];
  });
  // Si le niveau choisi n'existe plus pour ce membre, on retombe sur le premier.
  const activeLevelKey = currentMember.levelKeys.includes(chosenLevelKey) ? chosenLevelKey : currentMember.levelKeys[0];

  // "version" change à chaque mise à jour des données (paiement, vague
  // rejointe...) : le contexte change alors aussi, et toutes les parties de
  // l'espace qui lisent le niveau se redessinent avec les données à jour.
  const value = useMemo(
    () => ({
      activeLevelKey,
      setActiveLevelKey,
      levelKeys: currentMember.levelKeys,
      dataVersion: version,
    }),
    [activeLevelKey, version],
  );

  return <MemberLevelContext.Provider value={value}>{children}</MemberLevelContext.Provider>;
}

export function useMemberLevel() {
  const context = useContext(MemberLevelContext);
  if (!context) {
    throw new Error("useMemberLevel must be used within a MemberLevelProvider");
  }
  return context;
}
