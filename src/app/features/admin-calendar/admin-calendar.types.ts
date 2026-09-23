export type CalendarReviewReason =
  | 'DUPLICATE_SUBMISSIONS'
  | 'STAY_CHANGED'
  | 'VISIT_DATE_MISMATCH'
  | 'MISSING_MATCH_CONTEXT'
  | 'INVALID_SUBMISSION_RECORD';

export type CalendarChecklistStatus =
  'SCHEDULED' | 'NOT_SUBMITTED' | 'SUBMITTED' | 'NEEDS_REVIEW';

export interface CalendarChecklistDto {
  type: 'CHECK_IN' | 'CHECK_OUT';
  expectedDate: string;
  status: CalendarChecklistStatus;
  submissionCount: number;
  submissionId: string | null;
  reviewReasons: CalendarReviewReason[];
}

export interface AdminCalendarStayDto {
  id: string;
  property: {
    id: string;
    name: string;
    region: string | null;
    isActive: boolean;
  };
  guestName: string;
  checkInAt: string;
  checkOutAt: string;
  currentRevision: number;
  checkIn: CalendarChecklistDto;
  checkOut: CalendarChecklistDto;
}

export interface AdminCalendarInput {
  from: string;
  to: string;
  propertyId?: string;
}

export interface AdminCalendarData {
  from: string;
  to: string;
  timezone: 'Asia/Seoul';
  asOf: string;
  today: string;
  items: AdminCalendarStayDto[];
  total: number;
}
