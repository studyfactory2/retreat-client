export interface AdminDashboardInput {
  date?: string;
  propertyId?: string;
}

export interface DashboardChecklistCounts {
  scheduled: number;
  notSubmitted: number;
  submitted: number;
  needsReview: number;
  total: number;
}

export interface AdminDashboardDto {
  date: string;
  today: string;
  timezone: 'Asia/Seoul';
  asOf: string;
  stays: {
    arrivals: number;
    departures: number;
  };
  checklists: {
    checkIn: DashboardChecklistCounts;
    checkOut: DashboardChecklistCounts;
  };
  maintenance: {
    started: number;
    completed: number;
    completionNeedsReview: number;
    unfinished: {
      total: number;
      resumable: number;
      expired: number;
      accessBlocked: number;
      needsReview: number;
    };
  };
  issues: {
    new: number;
    inProgress: number;
    total: number;
  };
}
