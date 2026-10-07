import { appRoutes } from '../../../../core/router/routes';
import { issueSearch } from '../../issues/model/issue-filters';
import { maintenanceSearch } from '../../maintenance/model/maintenance-filters';

export function dashboardLinks(date: string, propertyId?: string) {
  const calendar = new URLSearchParams({ date });
  if (propertyId) calendar.set('propertyId', propertyId);
  const scope = {
    page: 1,
    propertyId,
    dateField: 'STARTED',
    view: 'ALL',
  } as const;
  return {
    calendar: `${appRoutes.adminCalendar}?${calendar.toString()}`,
    maintenance: {
      started: `${appRoutes.adminMaintenance}${maintenanceSearch({ ...scope, from: date, to: date })}`,
      completed: `${appRoutes.adminMaintenance}${maintenanceSearch({ ...scope, dateField: 'SUBMITTED', view: 'COMPLETED', from: date, to: date })}`,
      unfinished: `${appRoutes.adminMaintenance}${maintenanceSearch({ ...scope, view: 'UNFINISHED' })}`,
    },
    issues: {
      new: `${appRoutes.adminIssues}${issueSearch({ page: 1, propertyId, status: 'NEW' })}`,
      inProgress: `${appRoutes.adminIssues}${issueSearch({ page: 1, propertyId, status: 'IN_PROGRESS' })}`,
    },
  };
}
