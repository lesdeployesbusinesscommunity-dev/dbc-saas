// Local Imports
import { getAccountOverrides } from "../accountData";
import { getMemberStore } from "../memberStore";
import { levelKeyFromCode } from "utils/levelCodes";

// ----------------------------------------------------------------------
// Données de "Mon MLM" (partenariat Longrich), tirées du serveur (voir
// memberStore.js) sans changer la forme que les composants attendent.
//
// Système séparé des niveaux DBC/tontine : un membre possède un pack
// Longrich (qui donne accès à des paliers de commission), et ce pack est
// rattaché à un niveau DBC requis pour l'acheter ("eligibleLevelKey").
export function getMlmStats() {
  return { ...getAccountOverrides().mlm.stats };
}

// Le pack Longrich le plus récent du membre (achat confirmé), ou un pack
// "vide" s'il n'en a pas encore.
export function getMyPack() {
  return { ...getAccountOverrides().mlm.pack };
}

// Les 6 packs Longrich du catalogue serveur, du plus accessible au plus
// prestigieux. Chaque pack est rattaché au niveau DBC requis pour l'acheter
// ("levelKey", voir Simulateur/data.js : "levels") pour réutiliser sa
// couleur/icône. "gainType" distingue le premier palier (gains de parrainage
// direct seulement) des suivants (gains de performance sur le réseau).
export function getLongrichPacks() {
  return getMemberStore().packs.map((pack) => ({
    code: pack.code,
    name: pack.name,
    levelKey: levelKeyFromCode(pack.requiredLevelCode),
    price: pack.price,
    pv: pack.pv,
    gainType: pack.earningsType === "parrainage_seul" ? "referral" : "performance",
  }));
}

// "Mon réseau" : les filleuls du membre, parrainés directement ("direct",
// niveau 1) ou via un de ses filleuls ("indirect", niveau 2 ou plus), avec
// la commission Longrich que chacun lui a rapportée. "levelPosition" est le
// rang (1 à 8) du niveau DBC du filleul, pour reprendre sa couleur/icône.
export function getNetworkMembers() {
  return getAccountOverrides().mlm.network.map((member) => ({ ...member }));
}
