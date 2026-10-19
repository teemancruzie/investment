import { apiRequest, API_URL, ApiRequestError, tokenStore } from "./api";
import type { AuthUser } from "./auth.service";

export type ProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  avatar?: string;
};

/** Multipart upload against the Express `/uploads/*` endpoints. */
export async function uploadFile(path: string, file: File): Promise<{ url: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);

  const headers: Record<string, string> = {};
  if (tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: form });
  } catch {
    throw new ApiRequestError(
      "Cannot reach the API. Start the Express server in `backend/` and set VITE_API_URL.",
      0
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { success: boolean; message: string; data: { url: string; filename: string } }
    | null;

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(payload?.message ?? `Upload failed (${response.status})`, response.status);
  }
  return payload.data;
}

export const userService = {
  updateProfile(body: ProfilePayload) {
    return apiRequest<{ user: AuthUser }>("/users/profile", { method: "PATCH", body, auth: true });
  },
  updatePreferences(body: Record<string, boolean>) {
    return apiRequest<{ user: AuthUser }>("/users/preferences", { method: "PATCH", body, auth: true });
  },
  updateSecurity(body: { twoFactorEnabled: boolean }) {
    return apiRequest<{ user: AuthUser }>("/users/security", { method: "PATCH", body, auth: true });
  },
  changePassword(body: { currentPassword: string; newPassword: string }) {
    return apiRequest<{ accessToken: string; refreshToken: string }>("/auth/change-password", {
      method: "POST",
      body,
      auth: true,
    });
  },
  uploadAvatar(file: File) {
    return uploadFile("/uploads/avatar", file);
  },
};
