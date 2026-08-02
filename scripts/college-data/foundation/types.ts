export type SourceKey = 'ipeds-hd-2023' | 'scorecard-institution-2026-06-10';

export type SourceManifest = {
  sourceKey: string;
  producerName: string;
  datasetName: string;
  homepageUrl: string;
  releaseName: string;
  releaseType: 'preliminary' | 'provisional' | 'final' | 'rolling';
  sourceUrl: string;
  sourcePublishedAt: string;
  retrievedAt: string;
  bytes: number;
  sha256: string;
  member: string;
  objectPath: string;
  schemaVersion: string;
  academicYear: number;
  parser: 'ipeds_hd' | 'scorecard_institution';
};
export type InstitutionRecord = {
  sourceRecordLocator: string;
  unitid: number;
  officialName: string;
  status: 'active' | 'inactive' | 'closed' | 'merged' | 'unknown';
  institutionLevel: 'two_year' | 'four_year' | 'less_than_two_year' | 'other';
  ownership: 'public' | 'private_nonprofit' | 'private_for_profit' | 'other';
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  isEligible: boolean;
};

export type MetricRecord = {
  sourceRecordLocator: string;
  unitid: number;
  metricKey: string;
  academicYear: number;
  cohortKey: string;
  valueNumeric: number | null;
  unit: string;
  isSuppressed: boolean;
};

export type ParsedRecord = {
  institution: InstitutionRecord;
  metrics: MetricRecord[];
};

export type ValidationReport = {
  source: SourceKey;
  rowsRead: number;
  rowsAccepted: number;
  rowsRejected: number;
  eligibleRows: number;
  metricRows: number;
  suppressedMetricRows: number;
  duplicateUnitids: number[];
  rejectionReasons: Record<string, number>;
};
