// Import Dependencies
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  CursorArrowRaysIcon,
  FlagIcon,
  GlobeAltIcon,
  HomeModernIcon,
  LightBulbIcon,
  MapIcon,
  MegaphoneIcon,
  PresentationChartLineIcon,
  PuzzlePieceIcon,
  ReceiptPercentIcon,
  BuildingStorefrontIcon,
  HandRaisedIcon,
  Square3Stack3DIcon,
  StarIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  WalletIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------
// Les 4 PILIERS de la DBC, dans l'ordre : 01 FINANCER, 02 FORMER,
// 03 RÉSEAUTER, 04 INVESTIR — chacun avec une phrase d'accroche (voir
// i18n : "membre.piliers.groups.<clé>") et six programmes/mécanismes. La
// page "Piliers" les présente en quatre cartes ; "Détail <pilier>" ouvre la
// page de ce pilier avec son catalogue complet.
//
// Les noms et descriptions courts viennent de la liste fournie ; les
// textes (nom, résumé, explication) sont dans i18n ("piliers.items.<id>",
// FR et EN) pour que la page membre et la page admin parlent exactement
// des mêmes choses. Un programme n'est ici qu'identifié (id, pilier,
// icône) : tout ce que l'admin peut changer (statut, visibilité, résumé,
// explication) vit à part, dans pillarsStore.js.
//
// "page: true" : ce programme a sa propre page d'explication (principe,
// points clés, pour qui — voir Membre/Piliers/PillarPage.jsx). C'est le cas
// des programmes d'INVESTIR et des mécanismes de FINANCER ; ceux de
// FORMER et de RÉSEAUTER sont présentés par leur fiche dans le catalogue
// du pilier. "tag" : repère de niveau d'un programme FORMER (Niv.1→4...),
// texte dans i18n. Les icônes sont des Heroicons, jamais des émojis.
//
// "link" : page de l'espace membre qui existe déjà pour ce programme — la
// Tontine Royale, c'est "Ma Tontine", le Business MLM Longrich, c'est
// "Mon MLM" — pour que sa page d'explication y mène par un bouton.
export const pillarGroups = [
  { key: "financer", number: "01", Icon: WalletIcon },
  { key: "former", number: "02", Icon: BookOpenIcon },
  { key: "reseauter", number: "03", Icon: UserGroupIcon },
  { key: "investir", number: "04", Icon: ArrowTrendingUpIcon },
];

export const pillars = [
  // 01 · FINANCER
  { id: "tontine-royale", group: "financer", Icon: BanknotesIcon, status: "active", page: true, link: "/membre/tontine" },
  { id: "invest-club", group: "financer", Icon: TrophyIcon, status: "active", page: true },
  { id: "mlm-longrich", group: "financer", Icon: Square3Stack3DIcon, status: "active", page: true, link: "/membre/mlm" },
  { id: "credit-solidaire", group: "financer", Icon: ReceiptPercentIcon, status: "active", page: true },
  { id: "micro-equity", group: "financer", Icon: ChartPieIcon, status: "active", page: true },
  // "DBC Bank (projet)" : encore un projet (Phase 3, 2029–2030), pas un
  // service ouvert — statut "project" plutôt qu'"active".
  { id: "dbc-bank", group: "financer", Icon: BuildingLibraryIcon, status: "project", page: true },
  // 02 · FORMER
  { id: "ecole-affaires", group: "former", Icon: AcademicCapIcon, status: "active" },
  { id: "leadership-academy", group: "former", Icon: StarIcon, status: "active" },
  { id: "digital-masters", group: "former", Icon: CursorArrowRaysIcon, status: "active" },
  { id: "pitch-school", group: "former", Icon: PresentationChartLineIcon, status: "active" },
  { id: "sales-academy", group: "former", Icon: HandRaisedIcon, status: "active" },
  { id: "dbc-challenge", group: "former", Icon: FlagIcon, status: "active" },
  // 03 · RÉSEAUTER
  { id: "mastermind", group: "reseauter", Icon: LightBulbIcon, status: "active" },
  { id: "speed-networking", group: "reseauter", Icon: ChatBubbleLeftRightIcon, status: "active" },
  { id: "mentor-connect", group: "reseauter", Icon: UsersIcon, status: "active" },
  { id: "summit", group: "reseauter", Icon: MegaphoneIcon, status: "active" },
  { id: "dbc-tour", group: "reseauter", Icon: MapIcon, status: "active" },
  { id: "marketplace", group: "reseauter", Icon: BuildingStorefrontIcon, status: "active" },
  // 04 · INVESTIR
  { id: "diaspo-fund", group: "investir", Icon: GlobeAltIcon, status: "active", page: true },
  { id: "export-import", group: "investir", Icon: ArrowsRightLeftIcon, status: "active", page: true },
  { id: "joint-ventures", group: "investir", Icon: PuzzlePieceIcon, status: "active", page: true },
  { id: "real-estate", group: "investir", Icon: BuildingOffice2Icon, status: "active", page: true },
  { id: "invest-back-home", group: "investir", Icon: HomeModernIcon, status: "active", page: true },
  { id: "consulting", group: "investir", Icon: BriefcaseIcon, status: "active", page: true },
];

// "active" : ouvert. "soon" : annoncé, pas encore ouvert. "project" : en
// projet, à plus long terme (ex : DBC Bank).
export const pillarStatuses = ["active", "soon", "project"];

// Packs Longrich — détail PV (liste fournie telle quelle). "pack" est le
// montant du pack et "price" son prix ; "levelKey" rattache chaque pack à
// un niveau DBC (voir Simulateur/data.js) pour afficher son nom traduit.
// Note : "Mon MLM" (Membre/Mlm/mockData.js : "getLongrichPacks") affiche
// pour l'instant le montant du pack (24 000...) comme prix — à aligner
// avec la colonne "Prix" ci-dessous une fois confirmé lequel fait foi.
export const longrichPacks = [
  { pack: 24000, price: 30000, pv: 4, levelKey: "batisseurPro" },
  { pack: 90000, price: 100000, pv: 60, levelKey: "performer" },
  { pack: 150000, price: 165000, pv: 120, levelKey: "performerPro" },
  { pack: 330000, price: 350000, pv: 240, levelKey: "stratege" },
  { pack: 800000, price: 900000, pv: 720, levelKey: "elite" },
  { pack: 1800000, price: 2000000, pv: 1680, levelKey: "legende" },
];
