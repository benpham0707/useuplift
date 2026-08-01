import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseSourceRecord, requiredHeaders } from '../../scripts/college-data/foundation/parsers.ts';
import { readManifest } from '../../scripts/college-data/foundation/io.ts';

const fixtures = JSON.parse(readFileSync(
  new URL('./fixtures/foundation-records.json', import.meta.url), 'utf8'
));
const manifestPath = new URL('../../scripts/college-data/manifests/foundation-sources.json', import.meta.url).pathname;
const ipeds = readManifest(manifestPath, 'ipeds-hd-2023');
const scorecard = readManifest(manifestPath, 'scorecard-institution-2026-06-10');

test('IPEDS parser preserves active eligibility and closed status', () => {
  const active = parseSourceRecord(fixtures.ipedsActive, ipeds);
  const closed = parseSourceRecord(fixtures.ipedsClosed, ipeds);
  assert.equal(active.institution.isEligible, true);
  assert.equal(active.institution.ownership, 'public');
  assert.equal(closed.institution.status, 'inactive');
  assert.equal(closed.institution.isEligible, false);
  assert.equal(closed.institution.latitude, null);
});

test('graduate-only institutions are not eligible for high-school discovery', () => {
  const graduateOnlyIpeds = parseSourceRecord({ ...fixtures.ipedsActive, UGOFFER: '2' }, ipeds);
  const noUndergraduatesScorecard = parseSourceRecord({ ...fixtures.scorecardNull, UGDS: '0' }, scorecard);
  assert.equal(graduateOnlyIpeds.institution.isEligible, false);
  assert.equal(noUndergraduatesScorecard.institution.isEligible, false);
});

test('Scorecard parser distinguishes null and suppression', () => {
  const nullable = parseSourceRecord(fixtures.scorecardNull, scorecard);
  const suppressed = parseSourceRecord(fixtures.scorecardSuppressed, scorecard);
  assert.equal(nullable.metrics.some((metric) => metric.metricKey === 'admission_rate'), false);
  assert.equal(suppressed.metrics.find((metric) => metric.metricKey === 'admission_rate')?.isSuppressed, true);
  assert.equal(suppressed.metrics.find((metric) => metric.metricKey === 'cost_of_attendance')?.valueNumeric, null);
  assert.equal(suppressed.metrics.find((metric) => metric.metricKey === 'median_earnings_10yr')?.isSuppressed, true);
});

test('IPEDS and Scorecard institution-level codes are source-specific', () => {
  const ipedsCertificate = parseSourceRecord({ ...fixtures.ipedsActive, ICLEVEL: '3' }, ipeds);
  const scorecardCertificate = parseSourceRecord({ ...fixtures.scorecardNull, PREDDEG: '1' }, scorecard);
  const scorecardBachelor = parseSourceRecord({ ...fixtures.scorecardNull, PREDDEG: '3' }, scorecard);
  assert.equal(ipedsCertificate.institution.institutionLevel, 'less_than_two_year');
  assert.equal(scorecardCertificate.institution.institutionLevel, 'less_than_two_year');
  assert.equal(scorecardCertificate.institution.isEligible, false);
  assert.equal(scorecardBachelor.institution.institutionLevel, 'four_year');
  assert.equal(scorecardBachelor.institution.isEligible, true);
});

test('duplicate identity and conflicting values remain detectable', () => {
  const first = parseSourceRecord(fixtures.scorecardNull, scorecard);
  const conflict = parseSourceRecord(fixtures.scorecardConflict, scorecard);
  assert.equal(first.institution.unitid, conflict.institution.unitid);
  assert.notEqual(first.institution.officialName, conflict.institution.officialName);
});

test('schema drift is explicit instead of silently defaulted', () => {
  const drifted = { ...fixtures.scorecardNull };
  delete drifted.UNITID;
  assert.throws(() => parseSourceRecord(drifted, scorecard));
  assert.ok(requiredHeaders('scorecard_institution').includes('UNITID'));
});
