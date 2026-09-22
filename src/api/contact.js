// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// POST /contact — public, formulaire de contact (page Contacts).
export async function envoyerMessage({ name, email, phone, subject, message }) {
  const { data } = await httpClient.post("/contact", {
    name,
    email,
    phone: phone || undefined,
    subject,
    message,
  });
  return data;
}
