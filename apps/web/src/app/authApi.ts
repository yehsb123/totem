import { apiPost } from "@/services/apiClient";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

interface SignupResponse {
  message?: string;
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/users/login", { email, password });
}

export async function registerUser(
  payload: SignupPayload
): Promise<SignupResponse> {
  return apiPost<SignupResponse>("/users/register", payload);
}
