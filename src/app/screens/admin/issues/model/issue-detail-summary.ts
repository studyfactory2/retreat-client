import type {
  AdminIssueRecordDto,
  IssueStatus,
} from '../../../../features/admin-issues/admin-issues.types';

export function changedIssueContent(
  current: AdminIssueRecordDto,
  original: AdminIssueRecordDto,
): string[] {
  const fields: [string, boolean][] = [
    ['제목', current.title !== original.title],
    ['상세 내용', current.description !== original.description],
    [
      '신고 분류',
      current.category.id !== original.category.id ||
        current.category.name !== original.category.name,
    ],
    ['신고 위치', current.areaLabel !== original.areaLabel],
  ];
  return fields.filter(([, changed]) => changed).map(([label]) => label);
}

export function issueNextStep(status: IssueStatus): {
  label: string;
  selection: 'IN_PROGRESS' | 'RESOLVED';
  description: string;
} {
  if (status === 'NEW')
    return {
      label: '조치 시작',
      selection: 'IN_PROGRESS',
      description: '확인을 시작했다면 조치 시작을 선택하세요.',
    };
  if (status === 'IN_PROGRESS')
    return {
      label: '해결 처리',
      selection: 'RESOLVED',
      description: '문제가 해결되었다면 해결 내용을 남겨 주세요.',
    };
  return {
    label: '다시 조치',
    selection: 'IN_PROGRESS',
    description: '추가 확인이 필요할 때 다시 조치를 선택하세요.',
  };
}
