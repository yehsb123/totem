export interface Schedule {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  manager: string;
  schedule: { time: string; place: string }[];
  typeId: number;
  planId: number;
  color?: string;
}

export interface ScheduleRequestBody {
  name: string;
  startDate: string;
  endDate: string;
  manager: string;
  schedule: { time: string; place: string }[];
  typeId: number;
  planId: number;
}

export interface ScheduleUpdateBody {
  name: string;
  startDate: string;
  endDate: string;
  manager: string;
  schedule: { time: string; place: string }[];
  note: string;
  typeId: number;
  planId: number;
}

export interface EventType {
  id: number;
  name: string;
  emoji: string;
  color: string;
  defaultPlace?: string;
  defaultManager?: string;
}
