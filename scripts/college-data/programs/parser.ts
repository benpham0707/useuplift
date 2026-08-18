export const CIP_AREA_LABELS: Record<string, string> = {
  '01': 'Agriculture', '03': 'Natural Resources', '04': 'Architecture',
  '05': 'Area and Cultural Studies', '09': 'Communication and Journalism',
  '10': 'Communications Technology', '11': 'Computer Science',
  '12': 'Culinary and Personal Services', '13': 'Education', '14': 'Engineering',
  '15': 'Engineering Technology', '16': 'Languages and Linguistics',
  '19': 'Family and Consumer Sciences', '22': 'Legal Studies', '23': 'English',
  '24': 'Liberal Arts and Humanities', '25': 'Library Science',
  '26': 'Biological Sciences', '27': 'Mathematics and Statistics',
  '29': 'Military Technologies', '30': 'Interdisciplinary Studies',
  '31': 'Parks, Recreation, and Fitness', '38': 'Philosophy and Religion',
  '39': 'Theology and Religious Vocations', '40': 'Physical Sciences',
  '41': 'Science Technologies', '42': 'Psychology',
  '43': 'Homeland Security and Law Enforcement',
  '44': 'Public Administration and Social Services', '45': 'Social Sciences',
  '46': 'Construction Trades', '47': 'Mechanic and Repair Technologies',
  '48': 'Precision Production', '49': 'Transportation',
  '50': 'Visual and Performing Arts', '51': 'Health Professions',
  '52': 'Business and Marketing', '54': 'History',
};

export interface ProgramAreaRecord {
  unitid: number;
  cipAreaCode: string;
  cipAreaLabel: string;
  completions: number;
}

export function parseProgramAreaRow(row: Record<string, string>): ProgramAreaRecord | null {
  if (row.MAJORNUM?.trim() !== '1' || row.AWLEVEL?.trim() !== '5') return null;
  const unitid = Number(row.UNITID);
  const cipAreaCode = row.CIPCODE?.trim().slice(0, 2);
  const completions = Number(row.CTOTALT);
  if (!Number.isSafeInteger(unitid) || unitid <= 0) return null;
  if (!CIP_AREA_LABELS[cipAreaCode]) return null;
  if (!Number.isSafeInteger(completions) || completions <= 0) return null;
  return { unitid, cipAreaCode, cipAreaLabel: CIP_AREA_LABELS[cipAreaCode], completions };
}

export function aggregateProgramAreas(rows: Iterable<Record<string, string>>) {
  const aggregate = new Map<string, ProgramAreaRecord>();
  for (const row of rows) {
    const parsed = parseProgramAreaRow(row);
    if (!parsed) continue;
    const key = `${parsed.unitid}:${parsed.cipAreaCode}`;
    const existing = aggregate.get(key);
    aggregate.set(key, existing
      ? { ...existing, completions: existing.completions + parsed.completions }
      : parsed);
  }
  return [...aggregate.values()].sort((a, b) =>
    a.unitid - b.unitid || a.cipAreaCode.localeCompare(b.cipAreaCode));
}
