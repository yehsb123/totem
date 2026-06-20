import { apiGet } from "@/services/apiClient";

export interface Tour {
  plan_id: number;
  title: string;
  startDate: string;
  endDate: string;
  nation: string;
  age: number;
  gender: string;
  number: number;
  note: string;
  manager?: string;
  type?: string;
  capacity?: number;
  bookedSeats?: number;
  status?: string;
}

export async function fetchAllPlans(): Promise<Tour[]> {
  return apiGet<Tour[]>("/api/plan/v1");
}
