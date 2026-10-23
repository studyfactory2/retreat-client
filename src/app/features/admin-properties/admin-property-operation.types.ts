import type { AdminPropertyDto } from './admin-property-management.types';

export interface PropertyOperationPreview {
  property: AdminPropertyDto;
  checkedAt: string;
  blockingStayCount: number;
  stays: {
    id: string;
    guestName: string;
    checkInAt: string;
    checkOutAt: string;
  }[];
}
