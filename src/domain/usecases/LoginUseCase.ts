import { LoginSession } from '../models/AuthModel';
import { AuthRepository } from '../repository/AuthRepository';

export class LoginUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(email: string, password: string): Promise<LoginSession> {
    return this.repository.login(email.trim().toLowerCase(), password);
  }
}
