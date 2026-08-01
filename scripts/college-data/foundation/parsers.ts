import { z } from 'zod';
import type { ParsedRecord, SourceManifest } from './types.ts';

const states = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]);

const ipedsSchema = z.object({
  UNITID: z.string().min(1), INSTNM: z.string().min(1), CITY: z.string(),
  STABBR: z.string(), ZIP: z.string(), SECTOR: z.string(), ICLEVEL: z.string(),
  CONTROL: z.string(), CYACTIVE: z.string(), WEBADDR: z.string(),
  LONGITUD: z.string(), LATITUDE: z.string()
}).passthrough();

const scorecardSchema = z.object({
  UNITID: z.string().min(1), INSTNM: z.string().min(1), CITY: z.string(),
  STABBR: z.string(), ZIP: z.string(), INSTURL: z.string(), PREDDEG: z.string(),
  CONTROL: z.string(), CURROPER: z.string(), LATITUDE: z.string(),
  LONGITUDE: z.string(), UGDS: z.string(), ADM_RATE: z.string(),
  TUITIONFEE_IN: z.string(), TUITIONFEE_OUT: z.string(), COSTT4_A: z.string(),
  NPT4_PUB: z.string(), NPT4_PRIV: z.string(), PCTPELL: z.string(),
  C150_4: z.string(), RET_FT4: z.string(), MD_EARN_WNE_P10: z.string()
}).passthrough();

function numberOrNull(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '-2' || trimmed === '-1' || trimmed === 'NULL') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-2') return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function ownership(code: number | null) {
  if (code === 1) return 'public' as const;
  if (code === 2) return 'private_nonprofit' as const;
  if (code === 3) return 'private_for_profit' as const;
  return 'other' as const;
}

function level(code: number | null) {
  if (code === 1 || code === 3) return 'four_year' as const;
  if (code === 2) return 'two_year' as const;
  return 'other' as const;
}

function scorecardMetric(
  raw: Record<string, unknown>, field: string, metricKey: string,
  unit: string, manifest: SourceManifest, unitid: number
) {
  const rawValue = raw[field];
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!value) return null;
  const suppressed = value === 'PrivacySuppressed';
  const numeric = suppressed ? null : numberOrNull(value);
  if (!suppressed && numeric === null) return null;
  return {
    sourceRecordLocator: `${manifest.releaseName}:${unitid}`,
    unitid, metricKey, academicYear: manifest.academicYear, cohortKey: 'all',
    valueNumeric: numeric, unit, isSuppressed: suppressed
  };
}

export function requiredHeaders(parser: SourceManifest['parser']): string[] {
  return parser === 'ipeds_hd'
    ? Object.keys(ipedsSchema.shape)
    : Object.keys(scorecardSchema.shape);
}

export function parseSourceRecord(
  rawInput: Record<string, string>, manifest: SourceManifest
): ParsedRecord {
  const raw = Object.fromEntries(
    Object.entries(rawInput).map(([key, value]) => [key.replace(/^\uFEFF/, ''), value])
  );
  if (manifest.parser === 'ipeds_hd') {
    const row = ipedsSchema.parse(raw);
    const unitid = z.coerce.number().int().positive().parse(row.UNITID);
    const active = numberOrNull(row.CYACTIVE) === 1;
    const sector = numberOrNull(row.SECTOR);
    const institutionLevel = level(numberOrNull(row.ICLEVEL));
    return {
      institution: {
        sourceRecordLocator: `${manifest.releaseName}:${unitid}`, unitid,
        officialName: row.INSTNM.trim(), status: active ? 'active' : 'inactive',
        institutionLevel, ownership: ownership(numberOrNull(row.CONTROL)),
        city: row.CITY.trim() || null, state: row.STABBR.trim() || null,
        zip: row.ZIP.trim() || null, latitude: numberOrNull(row.LATITUDE),
        longitude: numberOrNull(row.LONGITUD), websiteUrl: normalizeUrl(row.WEBADDR),
        isEligible: active && institutionLevel === 'four_year' &&
          sector !== null && [1, 2, 3].includes(sector) && states.has(row.STABBR.trim())
      },
      metrics: []
    };
  }

  const row = scorecardSchema.parse(raw);
  const unitid = z.coerce.number().int().positive().parse(row.UNITID);
  const active = numberOrNull(row.CURROPER) === 1;
  const institutionLevel = level(numberOrNull(row.PREDDEG));
  const metrics = [
    scorecardMetric(row, 'UGDS', 'undergraduate_enrollment', 'students', manifest, unitid),
    scorecardMetric(row, 'ADM_RATE', 'admission_rate', 'ratio', manifest, unitid),
    scorecardMetric(row, 'TUITIONFEE_IN', 'tuition_in_state', 'usd', manifest, unitid),
    scorecardMetric(row, 'TUITIONFEE_OUT', 'tuition_out_of_state', 'usd', manifest, unitid),
    scorecardMetric(row, 'COSTT4_A', 'cost_of_attendance', 'usd', manifest, unitid),
    scorecardMetric(row, numberOrNull(row.CONTROL) === 1 ? 'NPT4_PUB' : 'NPT4_PRIV', 'net_price', 'usd', manifest, unitid),
    scorecardMetric(row, 'PCTPELL', 'pell_share', 'ratio', manifest, unitid),
    scorecardMetric(row, 'C150_4', 'completion_150pct', 'ratio', manifest, unitid),
    scorecardMetric(row, 'RET_FT4', 'retention_full_time', 'ratio', manifest, unitid),
    scorecardMetric(row, 'MD_EARN_WNE_P10', 'median_earnings_10yr', 'usd', manifest, unitid)
  ].filter((metric) => metric !== null);
  return {
    institution: {
      sourceRecordLocator: `${manifest.releaseName}:${unitid}`, unitid,
      officialName: row.INSTNM.trim(), status: active ? 'active' : 'inactive',
      institutionLevel, ownership: ownership(numberOrNull(row.CONTROL)),
      city: row.CITY.trim() || null, state: row.STABBR.trim() || null,
      zip: row.ZIP.trim() || null, latitude: numberOrNull(row.LATITUDE),
      longitude: numberOrNull(row.LONGITUDE), websiteUrl: normalizeUrl(row.INSTURL),
      isEligible: active && institutionLevel === 'four_year' && states.has(row.STABBR.trim())
    },
    metrics
  };
}
