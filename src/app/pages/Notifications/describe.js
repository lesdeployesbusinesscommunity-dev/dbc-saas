// Import Dependencies
import {
  AcademicCapIcon,
  BanknotesIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  MegaphoneIcon,
  ShareIcon,
  TrophyIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------
// Transforme une notification (voir feeds.js) en ce qu'on affiche : un
// titre, un texte, une icône et une couleur. Tous les textes viennent des
// traductions ("notifications.*") : on ne garde ici que la LOGIQUE (quelle
// clé, avec quelles valeurs). Une même fonction sert la cloche, la page
// membre et la page admin.

// Couleurs par ton — littérales pour que Tailwind les garde.
export const TONES = {
  info: "bg-[#52A2DF]/[0.12] text-[#52A2DF]",
  success: "bg-green-50 text-[#16A34A]",
  warning: "bg-[#EE7115]/[0.12] text-[#EE7115]",
  danger: "bg-red-50 text-red-600",
  gold: "bg-dbc-gold/[0.18] text-[#B8860B]",
  neutral: "bg-gray-100 text-gray-500",
};

const KIND_STYLE = {
  cotisationRetard: { Icon: ExclamationTriangleIcon, tone: "danger" },
  cotisationRappel: { Icon: ClockIcon, tone: "warning" },
  cotisationSuivi: { Icon: UsersIcon, tone: "info" },
  tourAttribue: { Icon: TrophyIcon, tone: "gold" },
  tourProche: { Icon: BellAlertIcon, tone: "gold" },
  choixMois: { Icon: CalendarDaysIcon, tone: "warning" },
  choixMoisEnvoye: { Icon: CheckCircleIcon, tone: "success" },
  choixMoisOrdre: { Icon: TrophyIcon, tone: "gold" },
  coins: { Icon: CircleStackIcon, tone: "gold" },
  filleul: { Icon: UserPlusIcon, tone: "success" },
  formationNouvelle: { Icon: AcademicCapIcon, tone: "info" },
  formationRappel: { Icon: AcademicCapIcon, tone: "warning" },
  rencontre: { Icon: CalendarDaysIcon, tone: "info" },
  dbc: { Icon: MegaphoneIcon, tone: "neutral" },
  adminNouveauMembre: { Icon: UserPlusIcon, tone: "info" },
  adminCotisations: { Icon: BanknotesIcon, tone: "info" },
  adminRetards: { Icon: ExclamationTriangleIcon, tone: "warning" },
  adminTour: { Icon: TrophyIcon, tone: "gold" },
  // Espace leader (entretiens d'inscription, relances) et leur suivi côté admin.
  leaderDossier: { Icon: ClipboardDocumentCheckIcon, tone: "info" },
  leaderRappel: { Icon: ClockIcon, tone: "warning" },
  leaderRetard: { Icon: ExclamationTriangleIcon, tone: "danger" },
  leaderRetards: { Icon: BellAlertIcon, tone: "warning" },
  adminEntretienRendu: { Icon: ClipboardDocumentCheckIcon, tone: "success" },
  adminEntretienRetard: { Icon: ExclamationTriangleIcon, tone: "warning" },
};

const REQUEST_ICON = {
  deleteAccount: UserMinusIcon,
  level: ArrowTrendingUpIcon,
  event: CalendarDaysIcon,
  reward: GiftIcon,
  tontineNext: ShareIcon,
};

const STATUS_TONE = {
  pending: "warning",
  validated: "success",
  refused: "danger",
  withdrawn: "neutral",
};

export function styleFor(item) {
  if (item.kind === "annonce") {
    return { Icon: MegaphoneIcon, tone: item.announcement?.importance === "important" ? "warning" : "info" };
  }
  if (item.kind === "request") {
    return { Icon: REQUEST_ICON[item.type] ?? BellAlertIcon, tone: STATUS_TONE[item.status] ?? "info" };
  }
  if (item.kind === "decision") {
    return {
      Icon: item.status === "validated" ? CheckCircleIcon : XCircleIcon,
      tone: item.status === "validated" ? "success" : "danger",
    };
  }
  return KIND_STYLE[item.kind] ?? { Icon: BellAlertIcon, tone: "info" };
}

export function statusTone(status) {
  return TONES[STATUS_TONE[status] ?? "neutral"];
}

// ----------------------------------------------------------------------
// Dates

export function formatDate(value, locale) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

// "il y a 3 h", "hier", puis la date complète au-delà d'une semaine.
export function formatRelative(at, locale, now = Date.now()) {
  const diffMs = at - now;
  const minutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 1) return String(locale).startsWith("fr") ? "à l'instant" : "just now";
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) <= 7) return rtf.format(days, "day");
  return formatDate(at, locale);
}

// ----------------------------------------------------------------------
// Libellés des détails d'une demande

const levelName = (t, key) => (key ? t(`simulateur.levels.${key}.name`) : "");

// Les valeurs insérées dans les phrases d'une demande (niveau, rencontre,
// récompense, choix de tontine).
export function requestParams(t, item) {
  const details = item.details ?? {};
  const base = {
    name: item.member?.name ?? "",
    level: levelName(t, details.levelKey),
    nextLevel: levelName(t, details.nextLevelKey),
    cost: details.cost ?? "",
  };
  if (item.type === "event") {
    base.event = t(`membre.dashboard.news.items.${details.eventId}.title`, { defaultValue: details.eventId });
  }
  if (item.type === "reward") {
    base.reward = t(`membre.coins.rewards.items.${details.rewardId}.title`, { defaultValue: details.rewardId });
  }
  if (item.type === "tontineNext") {
    base.choice = details.choice;
  }
  return base;
}

// Clé de texte d'une demande : la suite de tontine a deux variantes.
function requestKey(item) {
  if (item.type === "tontineNext") return `tontineNext.${item.details?.choice === "levelUp" ? "levelUp" : "restart"}`;
  return item.type;
}

// "2026-11" -> "novembre 2026" (dans la langue courante).
const formatMonth = (value, locale) =>
  value ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`)) : "";

// { title, text } d'une notification, dans la langue courante.
export function describe(item, t, locale) {
  // Une annonce est écrite par son auteur : son titre et son texte tels quels.
  if (item.kind === "annonce") {
    return { title: item.announcement.title, text: item.announcement.body };
  }

  if (item.kind === "request") {
    const params = requestParams(t, item);
    const key = requestKey(item);
    return {
      title: t(`notifications.requests.${key}.title`, params),
      text: t(`notifications.requests.${key}.text`, params),
    };
  }

  if (item.kind === "decision") {
    const params = requestParams(t, { ...item, member: null });
    const key = requestKey(item);
    return {
      title: t(`notifications.decisions.${key}.${item.status}.title`, params),
      text: t(`notifications.decisions.${key}.${item.status}.text`, params),
    };
  }

  const p = item.params ?? {};
  const params = {
    ...p,
    level: levelName(t, p.levelKey),
    amount: typeof p.amount === "number" ? new Intl.NumberFormat(locale).format(p.amount) : p.amount,
    due: p.due ? formatDate(p.due, locale) : "",
    date: p.date ? formatDate(p.date, locale) : "",
    names: Array.isArray(p.names) ? p.names.join(", ") : "",
    count: p.count,
  };

  switch (item.kind) {
    case "rencontre":
      params.event = t(`membre.dashboard.news.items.${p.eventId}.title`, { defaultValue: p.eventId });
      params.place = t(`membre.dashboard.news.items.${p.eventId}.place`, { defaultValue: "" });
      break;
    case "dbc":
      params.title = t(`membre.dashboard.news.items.${p.itemId}.title`, { defaultValue: p.itemId });
      params.text = t(`membre.dashboard.news.items.${p.itemId}.text`, { defaultValue: "" });
      break;
    case "tourAttribue":
    case "tourProche":
      params.months = p.monthsAway;
      break;
    case "cotisationRappel":
      params.days = p.days;
      break;
    case "leaderRappel":
    case "leaderRetard":
    case "adminEntretienRetard":
      params.days = p.days;
      params.count = p.days;
      break;
    case "choixMois":
    case "choixMoisEnvoye":
    case "choixMoisOrdre":
      params.start = formatMonth(p.start, locale);
      params.end = formatMonth(p.end, locale);
      params.month = formatMonth(p.month, locale);
      params.months = Array.isArray(p.months) ? p.months.map((value) => formatMonth(value, locale)).join(", ") : "";
      break;
    case "formationNouvelle":
    case "formationRappel":
      params.percent = p.percent;
      break;
    default:
      break;
  }

  // Variante selon le cas : une cotisation en retard "aujourd'hui" / "demain",
  // un tour "maintenant" / "dans N mois", un tour de cotisation complet...
  let variant = "";
  if (item.kind === "cotisationRappel") variant = p.days <= 0 ? ".today" : p.days === 1 ? ".tomorrow" : "";
  if (item.kind === "tourProche") variant = p.monthsAway <= 0 ? ".now" : "";
  if (item.kind === "cotisationSuivi" && p.paid === p.total) variant = ".complete";
  if (item.kind === "leaderRappel") variant = p.days <= 0 ? ".today" : "";
  if (item.kind === "adminEntretienRendu") variant = `.${p.decision}`;

  return {
    title: t(`notifications.items.${item.kind}${variant}.title`, params),
    text: t(`notifications.items.${item.kind}${variant}.text`, params),
  };
}

// Libellé court d'une demande vue DU CÔTÉ MEMBRE ("Mes demandes en cours").
export function describeMine(item, t) {
  const params = requestParams(t, item);
  return t(`notifications.mine.${requestKey(item)}`, params);
}
