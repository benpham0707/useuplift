import { describe, expect, it } from 'vitest';
import { aggregateProgramAreas, parseProgramAreaRow } from '../../scripts/college-data/programs/parser';

const row = (overrides: Record<string, string> = {}) => ({
  UNITID: '100001', CIPCODE: '11.0701', MAJORNUM: '1', AWLEVEL: '5', CTOTALT: '12', ...overrides,
});

describe('IPEDS program-area parser', () => {
  it('normalizes bachelor completions to a broad CIP area', () => {
    expect(parseProgramAreaRow(row())).toEqual({
      unitid: 100001, cipAreaCode: '11', cipAreaLabel: 'Computer Science', completions: 12,
    });
  });

  it('excludes non-bachelor, second-major, zero, suppressed, and unknown rows', () => {
    expect(parseProgramAreaRow(row({ AWLEVEL: '3' }))).toBeNull();
    expect(parseProgramAreaRow(row({ MAJORNUM: '2' }))).toBeNull();
    expect(parseProgramAreaRow(row({ CTOTALT: '0' }))).toBeNull();
    expect(parseProgramAreaRow(row({ CTOTALT: '.' }))).toBeNull();
    expect(parseProgramAreaRow(row({ CIPCODE: '99.0000' }))).toBeNull();
  });

  it('aggregates detailed programs within the same institution and area', () => {
    expect(aggregateProgramAreas([
      row({ CIPCODE: '11.0701', CTOTALT: '12' }),
      row({ CIPCODE: '11.0101', CTOTALT: '8' }),
      row({ CIPCODE: '14.0101', CTOTALT: '5' }),
    ])).toEqual([
      { unitid: 100001, cipAreaCode: '11', cipAreaLabel: 'Computer Science', completions: 20 },
      { unitid: 100001, cipAreaCode: '14', cipAreaLabel: 'Engineering', completions: 5 },
    ]);
  });
});
