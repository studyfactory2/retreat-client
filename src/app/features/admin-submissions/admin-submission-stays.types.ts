export interface SubmissionStayCandidate {
  id: string;
  propertyId: string;
  guestName: string;
  company: string | null;
  department: string | null;
  phone: string | null;
  checkInAt: string;
  checkOutAt: string;
  currentRevision: number;
  alreadyLinked: boolean;
}

export interface SubmissionStayCandidatesDto {
  submissionId: string;
  currentRevision: number;
  currentStayId: string | null;
  visitDate: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  items: SubmissionStayCandidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type LinkSubmissionStayInput = {
  expectedRevision: number;
  reason: string;
} & (
  | { stayId: string; expectedStayRevision: number }
  | { stayId: null; expectedStayRevision?: never }
);

export interface SubmissionStayLinkDto {
  id: string;
  stayId: string | null;
  revision: number;
  updatedAt: string;
  changed: boolean;
}
