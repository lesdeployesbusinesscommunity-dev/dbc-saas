import { CodeOtp } from './code-otp';

export abstract class CodeOtpRepositoryPort {
  abstract sauvegarder(code: CodeOtp): Promise<CodeOtp>;
  abstract trouverParId(id: string): Promise<CodeOtp | null>;
}
