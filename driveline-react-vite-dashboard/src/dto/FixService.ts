export interface DaySchedule {
  startUTC: number;
  endUTC: number;
}

export interface GetServicesResponse {
  data: FixService[];
}
export interface FixService {
  id: string;
  serviceAdminId?: number;
  techId: string;
  description: string;
  price: string;
  currency: string;
  durationMinutes: number;
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
