// Local Imports
import { getSessionSnapshot, subscribeSession } from "app/pages/Auth/session";

// ----------------------------------------------------------------------
// Identité de l'admin connecté, partagée par toutes les pages admin
// (dashboard, gestion des membres, etc.) : celle du compte ouvert sur
// /login (voir Auth/session.js — nom et photo du profil renvoyé par le
// serveur). "currentAdmin" reste UN SEUL objet dont le contenu suit la
// session, pour que chaque import existant lise toujours le bon compte.
export const currentAdmin = { name: "", role: "Admin", photo: null };

function sync() {
  const session = getSessionSnapshot().session;
  if (!session) return; // à la déconnexion, on garde le nom le temps de la redirection
  currentAdmin.name = session.name ?? "";
  currentAdmin.photo = session.user?.photoUrl ?? null;
}

sync();
subscribeSession(sync);
