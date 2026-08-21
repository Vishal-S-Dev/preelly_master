import { AuthRepository } from '../repository/AuthRepository';
import {
  AppleSignInRequestDto,
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

export class SignInWithGoogleUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(idToken: string) {
    return this.repo.signInWithGoogle(idToken.trim());
  }
}

export class SignInWithAppleUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: AppleSignInRequestDto) {
    return this.repo.signInWithApple({
      ...request,
      identityToken: request.identityToken.trim(),
      authorizationCode: request.authorizationCode.trim(),
      user: request.user
        ? {
            name: request.user.name?.trim() || undefined,
            email: request.user.email?.trim().toLowerCase() || undefined,
          }
        : undefined,
    });
  }
}
