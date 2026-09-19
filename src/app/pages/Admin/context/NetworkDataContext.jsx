// Import Dependencies
import { createContext, useContext, useState } from "react";

// Local Imports
import { initialNetworksByCountry } from "../Reseau/mockData";

// ----------------------------------------------------------------------

// L'arbre du réseau (qui dirige quelle branche, dans quel pays — voir
// Reseau/mockData.js) n'appartient plus seulement à "Gestion du réseau" :
// "Gestion de la gouvernance" le lit aussi, pour que "Réseau des Leaders
// d'Antennes" reflète les VRAIES branches et leurs VRAIS responsables,
// pas une liste inventée à part (voir Gouvernance/mockData.js). D'où ce
// contexte partagé, monté une fois dans AdminLayout au-dessus de toutes
// les pages admin : les deux pages lisent/écrivent le même état, donc un
// changement fait dans Gestion du réseau (assigner, ajouter une branche…)
// est immédiatement visible dans Gouvernance, tant qu'on reste dans la
// session (toujours pas de backend — rien ne survit à un rechargement de
// page, comme le reste de l'admin).
const NetworkDataContext = createContext(null);

export function NetworkDataProvider({ children }) {
  const [networksByCountry, setNetworksByCountry] = useState(initialNetworksByCountry);

  return (
    <NetworkDataContext.Provider value={{ networksByCountry, setNetworksByCountry }}>
      {children}
    </NetworkDataContext.Provider>
  );
}

export function useNetworkData() {
  const context = useContext(NetworkDataContext);
  if (!context) {
    throw new Error("useNetworkData doit être utilisé à l'intérieur de <NetworkDataProvider>.");
  }
  return context;
}
