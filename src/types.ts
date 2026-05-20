export type WorkspaceType = 'hot-desk' | 'meeting-room' | 'private-office' | 'event-space';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  capacity: number;
  pricePerHour: number;
  status: 'available' | 'occupied';
  image: string;
  bookedUntil: string | null; // ISO Date String
  bookedDurationHours: number | null;
  bookedAt: string | null; // ISO Date String
  amenities: string[];
  description: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  workspace?: Workspace;
}
