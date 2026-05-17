export interface ParsedTestCase {
  id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: string;
  category: string;
}

function extractTableField(section: string, fieldName: string): string {
  const lines = section.split('\n');
  for (const line of lines) {
    const match = line.match(new RegExp(`\\|\\s*\\*\\*${fieldName}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|\\s*$`));
    if (match) return match[1].trim();
  }
  return '';
}

export function parseTestCases(markdown: string): ParsedTestCase[] {
  const testCases: ParsedTestCase[] = [];

  const sections = markdown.split(/(?=^###\s+TC-)/m).filter(s => s.includes('TC ID') || s.includes('TC-'));

  for (const section of sections) {
    const id = extractTableField(section, 'TC ID');
    if (!id) continue;

    const stepsRaw = extractTableField(section, 'Steps');
    const steps = stepsRaw
      .split(/<br\s*\/?>/gi)
      .map(s => s.replace(/^\d+\.\s*/, '').trim())
      .filter(s => s.length > 0);

    testCases.push({
      id,
      title: extractTableField(section, 'Title'),
      preconditions: extractTableField(section, 'Preconditions'),
      steps,
      expectedResult: extractTableField(section, 'Expected Result'),
      priority: extractTableField(section, 'Priority'),
      category: extractTableField(section, 'Category'),
    });
  }

  return testCases;
}
