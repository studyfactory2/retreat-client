/** An explicit, readable format stored in the existing plain-text guide field. */
export const GUIDE_SECTION_MARKER = '[ITCEN 이용 안내 · 섹션형]';

export const GUIDE_SECTION_TEMPLATE = [
  { id: 'essentials', title: '꼭 확인해 주세요' },
  { id: 'parking', title: '주차 안내' },
  { id: 'wifi', title: 'Wi-Fi' },
  { id: 'facilities', title: '시설 이용' },
  { id: 'rules', title: '이용 수칙' },
  { id: 'checkout', title: '퇴실 안내' },
  { id: 'other', title: '기타 안내' },
] as const;

export type GuideSectionId = (typeof GUIDE_SECTION_TEMPLATE)[number]['id'];
export type GuideSection = {
  id: GuideSectionId;
  title: string;
  content: string;
};

export function createGuideSections(legacyContent = ''): GuideSection[] {
  return GUIDE_SECTION_TEMPLATE.map((section) => ({
    ...section,
    content: section.id === 'other' ? legacyContent : '',
  }));
}

export function serializeGuideSections(sections: GuideSection[]): string {
  if (
    sections.length !== GUIDE_SECTION_TEMPLATE.length ||
    new Set(sections.map((section) => section.id)).size !== sections.length
  ) {
    throw new Error('Invalid guide sections.');
  }
  const blocks = GUIDE_SECTION_TEMPLATE.map(({ id, title }) => {
    const section = sections.find((entry) => entry.id === id);
    if (!section) throw new Error('Invalid guide section.');
    // Escape heading-like text so an instruction can contain any literal line.
    const body = section.content
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => (/^[#\\]/.test(line) ? `\\${line}` : line))
      .join('\n');
    return `## ${title}\n${body}`;
  });
  return `${GUIDE_SECTION_MARKER}\n${blocks.join('\n')}`;
}

/** Unmarked or malformed documents remain complete, literal legacy text. */
export function parseGuideSections(content: string): GuideSection[] | null {
  const lines = content.split('\n');
  if (lines[0] !== GUIDE_SECTION_MARKER) return null;
  const sections = createGuideSections();
  let current = -1;
  let body: string[] = [];
  for (const line of lines.slice(1)) {
    if (line.startsWith('## ')) {
      const expected = GUIDE_SECTION_TEMPLATE[current + 1];
      if (!expected || line !== `## ${expected.title}`) return null;
      if (current >= 0) sections[current].content = body.join('\n');
      current += 1;
      body = [];
    } else {
      if (current < 0 || line.startsWith('#')) return null;
      if (line.startsWith('\\')) {
        if (!line.startsWith('\\\\') && !line.startsWith('\\#')) return null;
        body.push(line.slice(1));
      } else {
        body.push(line);
      }
    }
  }
  if (current !== sections.length - 1) return null;
  sections[current].content = body.join('\n');
  return sections;
}

export function guideSectionsToPlainText(sections: GuideSection[]): string {
  return sections
    .filter((section) => section.content.trim())
    .map((section) => `${section.title}\n${section.content}`)
    .join('\n\n');
}

export function hasGuideContent(content: string): boolean {
  const sections = parseGuideSections(content);
  return sections
    ? sections.some((section) => section.content.trim().length > 0)
    : content.trim().length > 0;
}
