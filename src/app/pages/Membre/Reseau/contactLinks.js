// ----------------------------------------------------------------------
// Liens "Appeler" / "WhatsApp" à partir d'un numéro de téléphone. WhatsApp
// ouvre une conversation avec un message pré-rempli (jamais envoyé
// automatiquement : la personne appuie elle-même sur "Envoyer"). Sans
// numéro, "wa.me" sans suffixe ouvre le sélecteur de contacts — utilisé
// pour PARTAGER son lien de parrainage à n'importe qui (Reseau/
// InviteCard.jsx).
export function whatsappLink(phone, text) {
  const base = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "https://wa.me/";
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(phone) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
