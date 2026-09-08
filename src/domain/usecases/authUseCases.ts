import { AuthRepository } from '../repository/AuthRepository';
import {
  AppleSignInRequestDto,
  AttachEmailRequestDto,
  AttachPhoneRequestDto,
  CompleteVerifyEmailRequestDto,
  CompleteVerifyPhoneRequestDto,
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

export class AttachEmailUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: AttachEmailRequestDto) {
    return this.repo.attachEmail({ ...request, email: request.email.trim().toLowerCase() });
  }
}

export class AttachPhoneUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: AttachPhoneRequestDto) {
    return this.repo.attachPhone(request);
  }
}

export class CompleteVerifyEmailUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: CompleteVerifyEmailRequestDto) {
    return this.repo.completeVerifyEmail({
      ...request,
      otp: request.otp.trim(),
      email: request.email.trim().toLowerCase(),
    });
  }
}

export class CompleteVerifyPhoneUseCase {
  constructor(private readonly repo: AuthRepository) {}
  execute(request: CompleteVerifyPhoneRequestDto) {
    return this.repo.completeVerifyPhone({ ...request, otp: request.otp.trim() });
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
