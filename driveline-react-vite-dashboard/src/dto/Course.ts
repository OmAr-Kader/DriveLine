import type { DaySchedule } from './FixService';

export interface GetCoursesResponse {
  data: Course[];
}

export interface Course {
  id: string;
  courseAdminId?: number;
  techId: string;
  description: string;
  price: string;
  currency: string;
  sessions: number;
  isActive: boolean;
  images: string[];
  monday?: DaySchedule | null;
  tuesday?: DaySchedule | null;
  wednesday?: DaySchedule | null;
  thursday?: DaySchedule | null;
  friday?: DaySchedule | null;
  saturday?: DaySchedule | null;
  sunday?: DaySchedule | null;
  createdAt: string;
  updatedAt: string;
}
