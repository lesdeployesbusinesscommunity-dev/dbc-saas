// Local Imports
import { Page } from "components/shared/Page";
import { Hero } from "./Hero";
import { ContactInfo } from "./ContactInfo";
import { ContactForm } from "./ContactForm";

// ----------------------------------------------------------------------

// Page "Contacts" = /contacts. Petit hero, puis les coordonnées (bandeau
// orange, comme "Un écosystème"/"Notre ambition" sur A propos, avec le
// même filigrane "afr" pour garder la signature Afrique du site), puis le
// formulaire de contact.
export default function Contacts() {
  return (
    <Page title="Contacts">
      <Hero />
      <ContactInfo />
      <ContactForm />
    </Page>
  );
}
