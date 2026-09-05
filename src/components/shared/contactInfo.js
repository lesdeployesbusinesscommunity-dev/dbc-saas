// Import Dependencies
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";

// ----------------------------------------------------------------------

// Coordonnées de la DBC, centralisées ici pour être affichées à
// l'identique sur la page Contacts (ContactInfo.jsx) et dans le footer
// (PublicFooter.jsx) : une seule source à mettre à jour quand les vraies
// informations seront connues. Ce sont pour l'instant des valeurs
// d'exemple (adresse, téléphone, email, liens réseaux) à remplacer.
export const CONTACT_EMAIL = "contact@dbc-community.com";
export const CONTACT_PHONE = "+33 1 23 45 67 89";
export const CONTACT_PHONE_HREF = "tel:+33123456789";
export const CONTACT_ADDRESS = "Antennes : Paris, France · Montréal, Canada";

// href: "#" en attendant les vrais liens des réseaux de la DBC.
export const socialLinks = [
  { key: "facebook", Icon: FaFacebookF, href: "#", label: "Facebook" },
  { key: "instagram", Icon: FaInstagram, href: "#", label: "Instagram" },
  { key: "linkedin", Icon: FaLinkedinIn, href: "#", label: "LinkedIn" },
  { key: "whatsapp", Icon: FaWhatsapp, href: "#", label: "WhatsApp" },
];
