import type {
  ChecklistDefinition,
  ChecklistType,
} from './admin-checklist-template.types';

export interface ChecklistVersionSummary {
  version: number;
  title: string;
  isActive: boolean;
  // For a baseline, this is the previous template's known last-save time.
  publishedAt: string;
  actor: { id: string; name: string } | null;
  source: 'PUBLISHED' | 'BASELINE';
  sectionCount: number;
  itemCount: number;
}

export interface ChecklistVersionHistory {
  templateId: string;
  currentVersion: number;
  items: ChecklistVersionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChecklistVersionDetail extends ChecklistVersionSummary {
  templateId: string;
  propertyId: string;
  type: ChecklistType;
  definition: ChecklistDefinition;
}
