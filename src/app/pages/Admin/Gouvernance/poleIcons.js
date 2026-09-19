// Import Dependencies
import {
  AcademicCapIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------
// Icônes disponibles pour un pôle de gouvernance — un pôle ne stocke que
// la clé ("iconKey"), jamais le composant lui-même, pour rester une
// donnée simple (voir mockData.js) ; "POLE_ICON_OPTIONS" alimente le
// sélecteur du formulaire (voir PoleFormModal.jsx) et "POLE_ICON_MAP"
// résout la clé en composant au moment de l'affichage (voir index.jsx).
export const POLE_ICON_OPTIONS = [
  { key: "sparkles", Icon: SparklesIcon },
  { key: "briefcase", Icon: BriefcaseIcon },
  { key: "globe", Icon: GlobeAltIcon },
  { key: "trophy", Icon: TrophyIcon },
  { key: "shield", Icon: ShieldCheckIcon },
  { key: "users", Icon: UserGroupIcon },
  { key: "star", Icon: StarIcon },
  { key: "academic", Icon: AcademicCapIcon },
];

export const POLE_ICON_MAP = Object.fromEntries(
  POLE_ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]),
);
