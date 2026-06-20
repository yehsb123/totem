import { apiGet, apiPost, apiPut, apiDelete, SCHEDULER_BASE } from "@/services/apiClient";
import type { Schedule, ScheduleRequestBody, ScheduleUpdateBody, EventType } from "@/types/schedule";

// ---- Schedule CRUD ----

export function getSchedules() {
  return apiGet<Schedule[]>("/api/scheduler/v1", SCHEDULER_BASE);
}

export function createSchedule(body: ScheduleRequestBody) {
  return apiPost<Schedule>("/api/scheduler/v1", body, SCHEDULER_BASE);
}

export function updateSchedule(id: number, body: ScheduleUpdateBody) {
  return apiPut<Schedule>(`/api/scheduler/${id}/v1`, body, SCHEDULER_BASE);
}

export function deleteSchedule(id: number) {
  return apiDelete<{ message: string }>(`/api/scheduler/${id}/v1`, SCHEDULER_BASE);
}

// ---- Label (EventType) CRUD ----

export function getLabels() {
  return apiGet<EventType[]>("/api/scheduler/labels/v1", SCHEDULER_BASE);
}

export function getLabelDetail(id: number) {
  return apiGet<EventType>(`/api/scheduler/labels/${id}/v1`, SCHEDULER_BASE);
}

export function createLabel(body: Omit<EventType, "id">) {
  return apiPost<EventType>("/api/scheduler/labels/v1", body, SCHEDULER_BASE);
}

export function updateLabel(id: number, body: Omit<EventType, "id">) {
  return apiPut<EventType>(`/api/scheduler/labels/${id}/v1`, body, SCHEDULER_BASE);
}

export function deleteLabel(id: number) {
  return apiDelete<{ message: string }>(`/api/scheduler/labels/${id}/v1`, SCHEDULER_BASE);
}
