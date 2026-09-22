/** Port vers le canal d'envoi des codes OTP — WhatsApp (cahier des charges §2.4/3.1). */
export abstract class EnvoyeurOtpPort {
  abstract envoyer(telephone: string, code: string): Promise<void>;
}
