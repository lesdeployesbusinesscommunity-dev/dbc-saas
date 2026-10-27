// Local Imports
import { openMail } from "app/pages/Notifications/mail";

// ----------------------------------------------------------------------
// Rappels d'une demande de choix (voir monthChoices.js). Le site n'envoie
// rien lui-même : il OUVRE le message déjà rédigé (messagerie de
// l'administrateur pour l'e-mail, WhatsApp pour le numéro du membre) et
// l'administrateur n'a plus qu'à l'envoyer. Quand le serveur sera branché,
// ces envois partiront de là-bas, sans changer ce que l'administrateur voit.

const enc = encodeURIComponent;

// Le texte du rappel : { subject, body } dans la langue active. "fmt"
// apporte les dates déjà mises en forme (voir CampaignDetailModal).
export function buildReminder(campaign, target, t, fmt) {
  const params = {
    name: target.name,
    level: t(`simulateur.levels.${campaign.levelKey}.name`),
    start: fmt.monthYear(campaign.startMonth),
    from: fmt.monthYear(campaign.months[0]),
    to: fmt.monthYear(campaign.months[campaign.months.length - 1]),
    deadline: fmt.fullDate(campaign.deadline),
    count: Math.min(3, campaign.months.length),
    link: `${window.location.origin}/membre/tontine`,
  };
  return {
    subject: t("admin.tontine.choices.reminder.subject", params),
    body: t("admin.tontine.choices.reminder.body", params),
  };
}

export function sendEmailReminder(target, reminder) {
  openMail("default", { to: target.email, subject: reminder.subject, body: reminder.body });
}

// Un seul e-mail pour plusieurs membres, adresses en copie cachée.
export function sendGroupEmail(targets, reminder) {
  const bcc = targets.map((target) => target.email).filter(Boolean).join(",");
  window.location.href = `mailto:?bcc=${enc(bcc)}&subject=${enc(reminder.subject)}&body=${enc(reminder.body)}`;
}

// WhatsApp n'accepte que des chiffres, sans "+" ni espaces.
export function whatsappUrl(target, reminder) {
  const digits = String(target.whatsapp ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${enc(reminder.body)}`;
}

export function sendWhatsAppReminder(target, reminder) {
  window.open(whatsappUrl(target, reminder), "_blank", "noopener,noreferrer");
}
