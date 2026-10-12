// Import Dependencies
import { getPlatformSettings } from "app/pages/Admin/Parametres/platformSettings";
import { requestParams } from "./describe";

// ----------------------------------------------------------------------
// "Écrire un mail" (page Notifications de l'admin) : prépare un message
// adressé au membre, avec son PROFIL COMPLET dessous, et l'ouvre dans la
// messagerie de l'admin — l'application par défaut de son ordinateur
// (mailto:), Gmail ou Outlook sur le web. Le site n'envoie rien lui-même :
// il pré-remplit, l'admin relit, complète et envoie depuis sa messagerie.
//
// Le profil est celui enregistré AU MOMENT de la demande (voir
// notificationsStore.js : "member").

const NEWLINE = "\r\n";

// Les lignes du profil, dans l'ordre où elles apparaissent dans le mail et
// dans la fiche affichée à l'écran (voir RequestCard.jsx).
export function profileRows(member, t) {
  const levels = (member.levelKeys ?? []).map((key) => t(`simulateur.levels.${key}.name`)).join(", ");
  return [
    { key: "name", label: t("notifications.profile.name"), value: member.name },
    { key: "matricule", label: t("notifications.profile.matricule"), value: member.matricule },
    { key: "email", label: t("notifications.profile.email"), value: member.email },
    { key: "whatsapp", label: t("notifications.profile.whatsapp"), value: member.whatsapp },
    {
      key: "location",
      label: t("notifications.profile.location"),
      value: [member.city, member.country].filter(Boolean).join(", "),
    },
    { key: "profession", label: t("notifications.profile.profession"), value: member.profession },
    { key: "levels", label: t("notifications.profile.levels"), value: levels },
    {
      key: "coins",
      label: t("notifications.profile.coins"),
      value: member.coins != null ? String(member.coins) : "",
    },
    {
      key: "sponsored",
      label: t("notifications.profile.sponsored"),
      value: member.sponsoredCount != null ? String(member.sponsoredCount) : "",
    },
  ].filter((row) => row.value);
}

// Sujet + corps du mail pour une demande, dans la langue courante.
export function buildMail(item, t) {
  const member = item.member ?? {};
  const platform = getPlatformSettings();
  const params = requestParams(t, item);
  const key = item.type === "tontineNext" ? `tontineNext.${item.details?.choice === "levelUp" ? "levelUp" : "restart"}` : item.type;

  const lines = [
    t("notifications.mail.greeting", { firstName: member.firstName || member.name }),
    "",
    t(`notifications.mail.intro.${key}`, params),
    "",
    t("notifications.mail.profileTitle"),
    ...profileRows(member, t).map((row) => `- ${row.label} : ${row.value}`),
    "",
    t("notifications.mail.closing"),
    t("notifications.mail.signature", {
      platform: platform.general.platformName,
    }),
  ];
  const contact = [platform.general.supportEmail, platform.general.supportPhone].filter(Boolean).join(" · ");
  if (contact) lines.push(contact);

  return {
    to: member.email ?? "",
    subject: t(`notifications.mail.subject.${key}`, params),
    body: lines.join(NEWLINE),
  };
}

const enc = encodeURIComponent;

// Messagerie par défaut de l'ordinateur (Outlook de bureau, Mail, Thunderbird...).
export function mailtoUrl({ to, subject, body }) {
  return `mailto:${enc(to)}?subject=${enc(subject)}&body=${enc(body)}`;
}

// Gmail sur le web (fenêtre de rédaction pré-remplie).
export function gmailUrl({ to, subject, body }) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;
}

// Outlook sur le web (comptes Microsoft 365, Outlook.com et Hotmail).
export function outlookUrl({ to, subject, body }) {
  return `https://outlook.office.com/mail/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;
}

export const MAIL_PROVIDERS = [
  { key: "default", build: mailtoUrl },
  { key: "gmail", build: gmailUrl },
  { key: "outlook", build: outlookUrl },
];

// Ouvre le message dans le fournisseur choisi. "mailto:" passe par
// l'application par défaut ; les deux autres s'ouvrent dans un nouvel onglet.
export function openMail(providerKey, mail) {
  const provider = MAIL_PROVIDERS.find((p) => p.key === providerKey) ?? MAIL_PROVIDERS[0];
  const url = provider.build(mail);
  if (provider.key === "default") {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}
