export type ImportMappingDraft = {
  key: number;
  sheetName: string;
  propertyId: string;
};

export type ImportMappingErrors = {
  message?: string;
  rows: Record<number, { sheetName?: string; propertyId?: string }>;
};

export function validateImportFile(
  file: Pick<File, 'name' | 'size'> | null,
  maxBytes: number,
): string | undefined {
  if (!file) return '미리보기를 만들 .xls 파일을 선택해 주세요.';
  if (!/\.xls$/i.test(file.name)) return '.xls 파일만 업로드할 수 있습니다.';
  if (file.size <= 0)
    return '내용이 없는 파일입니다. 파일을 다시 확인해 주세요.';
  if (file.size > maxBytes) return '5MB 이하의 파일을 선택해 주세요.';
  return undefined;
}

export function validateImportMappings(
  mappings: ImportMappingDraft[],
  activePropertyIds: ReadonlySet<string> | null,
): ImportMappingErrors {
  const errors: ImportMappingErrors = { rows: {} };
  if (mappings.length > 40)
    errors.message = '시트 연결은 최대 40개까지 추가할 수 있습니다.';
  if (mappings.length && activePropertyIds === null)
    errors.message =
      '휴양소 목록을 확인하거나 연결 항목을 삭제한 뒤 다시 진행해 주세요.';

  const sheetKeys = new Map<string, number[]>();
  const propertyKeys = new Map<string, number[]>();
  for (const mapping of mappings) {
    const row: ImportMappingErrors['rows'][number] = {};
    if (!mapping.sheetName.trim())
      row.sheetName = '파일에 적힌 시트 이름을 입력해 주세요.';
    else if ([...mapping.sheetName].length > 31)
      row.sheetName = '시트 이름은 31자 이하여야 합니다.';
    if (!mapping.propertyId) row.propertyId = '연결할 휴양소를 선택해 주세요.';
    else if (
      activePropertyIds !== null &&
      !activePropertyIds.has(mapping.propertyId.toLowerCase())
    )
      row.propertyId = '현재 활성 상태인 휴양소를 선택해 주세요.';
    if (Object.keys(row).length) errors.rows[mapping.key] = row;
    if (mapping.sheetName.trim())
      sheetKeys.set(mapping.sheetName, [
        ...(sheetKeys.get(mapping.sheetName) ?? []),
        mapping.key,
      ]);
    if (mapping.propertyId) {
      const id = mapping.propertyId.toLowerCase();
      propertyKeys.set(id, [...(propertyKeys.get(id) ?? []), mapping.key]);
    }
  }
  for (const keys of sheetKeys.values())
    if (keys.length > 1)
      for (const key of keys)
        errors.rows[key] = {
          ...errors.rows[key],
          sheetName: '같은 시트 이름을 중복 연결할 수 없습니다.',
        };
  for (const keys of propertyKeys.values())
    if (keys.length > 1)
      for (const key of keys)
        errors.rows[key] = {
          ...errors.rows[key],
          propertyId: '같은 휴양소를 여러 시트에 연결할 수 없습니다.',
        };
  return errors;
}
