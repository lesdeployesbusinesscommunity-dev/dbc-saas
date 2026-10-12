// Local Imports
import { httpClient } from "./httpClient";

// ----------------------------------------------------------------------

// POST /auth/login — connexion par matricule DBC + mot de passe. Renvoie soit
// { accessToken, user }, soit { otpRequired: true, otpChallengeId } si la
// double authentification est active (le code part par WhatsApp).
export async function login({ membershipNumber, password }) {
  const { data } = await httpClient.post("/auth/login", { membershipNumber, password });
  return data;
}

// POST /auth/verify-otp — seconde étape quand la double authentification est active.
export async function verifyOtp({ otpChallengeId, code }) {
  const { data } = await httpClient.post("/auth/verify-otp", { otpChallengeId, code });
  return data;
}

// POST /auth/refresh — nouveau jeton pour une session active (voir SessionGuard).
export async function refreshToken() {
  const { data } = await httpClient.post("/auth/refresh");
  return data.accessToken;
}

// GET /auth/me — profil complet (nom, matricule, niveau, rôle, 2FA).
export async function getMe() {
  const { data } = await httpClient.get("/auth/me");
  return data;
}

// POST /auth/password — l'ancien mot de passe est exigé.
export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await httpClient.post("/auth/password", { currentPassword, newPassword });
  return data;
}

// POST /auth/2fa/enable | /auth/2fa/disable
export async function setTwoFactor(enabled) {
  const { data } = await httpClient.post(enabled ? "/auth/2fa/enable" : "/auth/2fa/disable");
  return data.twoFactorEnabled;
}
