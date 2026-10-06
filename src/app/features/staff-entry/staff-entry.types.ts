export interface StaffChecklistItem {
  id: string;
  label: string;
  required: boolean;
  answerType: 'NORMAL_ABNORMAL';
}

export interface StaffChecklistSection {
  id: string;
  title: string;
  items: StaffChecklistItem[];
}

export interface StaffChecklistDefinition {
  schemaVersion: 1;
  sections: StaffChecklistSection[];
}

export interface StaffChecklistDto {
  id: string;
  type: 'MAINTENANCE';
  title: string;
  version: number;
  definition: StaffChecklistDefinition;
}

export interface StaffQrContextDto {
  flow: 'STAFF';
  property: { id: string; name: string; region: string | null };
  assignedStaff: { id: string; name: string } | null;
  checklists: StaffChecklistDto[];
}
