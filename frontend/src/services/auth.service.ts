import { apiRequest, tokenStore } from "./api";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  avatar: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
};

type AuthPayload = { user: AuthUser; accessToken: string; refreshToken: string };

function persist(payload: AuthPayload) {
  tokenStore.set(payload.accessToken, payload.refreshToken);
  return payload.user;
}

export const authService = {
  async register(input: { firstName: string; lastName: string; email: string; password: string }) {
    return persist(await apiRequest<AuthPayload>("/auth/register", { method: "POST", body: input }));
  },

  async login(input: { email: string; password: string }) {
    return persist(await apiRequest<AuthPayload>("/auth/login", { method: "POST", body: input }));
  },

  async me() {
    const { user } = await apiRequest<{ user: AuthUser }>("/auth/me", { auth: true });
    return user;
  },

  async logout() {
    try {
      await apiRequest<null>("/auth/logout", { method: "POST", auth: true });
    } finally {
      tokenStore.clear();
    }
  },

  forgotPassword(email: string) {
    return apiRequest<null>("/auth/forgot-password", { method: "POST", body: { email } });
  },

  async resetPassword(input: { token: string; password: string }) {
    return persist(
      await apiRequest<AuthPayload>("/auth/reset-password", { method: "POST", body: input })
    );
  },

  verifyEmail(token: string) {
    return apiRequest<{ user: AuthUser }>("/auth/verify-email", { method: "POST", body: { token } });
  },

  resendVerification() {
    return apiRequest<null>("/auth/resend-verification", { method: "POST", auth: true });
  },
};
