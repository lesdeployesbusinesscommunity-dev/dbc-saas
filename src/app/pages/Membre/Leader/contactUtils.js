// ----------------------------------------------------------------------
// Aides pour contacter un candidat ou un membre depuis l'espace leader.
// Les liens WhatsApp / appel viennent de Reseau/contactLinks.js (le message
// est pré-rempli, jamais envoyé automatiquement : le leader appuie lui-même
// sur "Envoyer").
export { telLink, whatsappLink } from "../Reseau/contactLinks";

// Un numéro est utilisable s'il contient assez de chiffres pour être
// composé (au moins 8) ; sinon les boutons WhatsApp / Appeler sont grisés.
export const isDialable = (phone) => String(phone ?? "").replace(/\D/g, "").length >= 8;

export const mailtoLink = (email, subject, body) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
