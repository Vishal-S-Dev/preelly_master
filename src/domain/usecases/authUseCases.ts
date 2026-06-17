import { AuthRepository } from '../repository/AuthRepository';
import { SendOtpRequestDTO } from '../../data/dto/authDto';

export class SendOtpUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: SendOtpRequestDTO) {
    return this.repo.sendOtp(request);
  }
}

export class VerifyOtpUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(email: string, otp: string) {
    return this.repo.verifyOtp(email.trim().toLowerCase(), otp.trim());
  }
}
