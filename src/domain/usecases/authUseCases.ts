import { AuthRepository } from '../repository/AuthRepository';
import {
  SendOtpRequestDTO,
  VerifyOtpRequestDto,
} from '../../data/dto/authDto';

export class SendOtpUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: SendOtpRequestDTO) {
    return this.repo.sendOtp(request);
  }
}

export class VerifyOtpUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: VerifyOtpRequestDto) {
    return this.repo.verifyOtp({
      ...request,
      otp: request.otp.trim(),
      email: request.email?.trim().toLowerCase(),
    });
  }
}
