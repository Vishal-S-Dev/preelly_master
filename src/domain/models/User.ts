export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  bio: string;
}
