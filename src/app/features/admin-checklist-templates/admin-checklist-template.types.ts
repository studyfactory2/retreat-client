export type ChecklistType = 'CHECK_IN' | 'CHECK_OUT' | 'MAINTENANCE';

export type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  answerType: 'NORMAL_ABNORMAL';
};

export type ChecklistSection = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

export type ChecklistDefinition = {
  schemaVersion: 1;
  sections: ChecklistSection[];
};

export interface ChecklistTemplatePropertyDto {
  id: string;
  name: string;
  region: string | null;
  isActive: boolean;
}

export interface ChecklistTemplateDto {
  id: string;
  propertyId: string;
  type: ChecklistType;
  title: string;
  version: number;
  definition: ChecklistDefinition;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  property: ChecklistTemplatePropertyDto;
}

export type ChecklistItemInput = Omit<ChecklistItem, 'id'> & { id?: string };
export type ChecklistSectionInput = {
  id?: string;
  title: string;
  items: ChecklistItemInput[];
};

export interface CreateChecklistTemplateInput {
  propertyId: string;
  type: ChecklistType;
  title: string;
  sections: ChecklistSectionInput[];
}

export interface UpdateChecklistTemplateInput {
  expectedVersion: number;
  title?: string;
  sections?: ChecklistSectionInput[];
  isActive?: boolean;
}
