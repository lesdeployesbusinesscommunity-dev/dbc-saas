// Import Dependencies
import { createContext, useContext, useMemo, useState } from "react";

// Local Imports
import { currentMember } from "../currentMember";

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
  const [activeLevelKey, setActiveLevelKey] = useState(currentMember.levelKeys[0]);

  const value = useMemo(
    () => ({
      activeLevelKey,
      setActiveLevelKey,
      levelKeys: currentMember.levelKeys,
    }),
    [activeLevelKey],
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
