import type { CurrentUser } from './common';

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthSession = {
  user: CurrentUser;
};

export type AuthMeResponse = CurrentUser;
export type LoginResponse = AuthSession;
export type RegisterResponse = AuthSession;
