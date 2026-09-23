import { apiGet, apiPatch, apiDelete } from "@/services/apiClient";

export interface UserMessageResponse {
  message: string;
}

export interface UserProfileResponse {
  username: string;
  email: string;
}

export async function fetchUserProfile(
  email: string
): Promise<UserProfileResponse> {
  return apiGet<UserProfileResponse>(`/api/users/${email}/v1`);
}

export async function updateUserProfile(
  email: string,
  username: string
): Promise<UserMessageResponse> {
  return apiPatch<UserMessageResponse>(`/api/users/${email}/v1`, {
    username,
    email,
  });
}

export async function deleteUserByEmail(
  email: string
): Promise<UserMessageResponse> {
  return apiDelete<UserMessageResponse>(`/api/users/${email}/v1`);
}
