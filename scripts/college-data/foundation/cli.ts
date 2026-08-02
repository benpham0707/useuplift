#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { csvRecords, downloadArtifact, readManifest, storeArtifact, verifyArtifact } from './io.ts';
import { parseSourceRecord, requiredHeaders } from './parsers.ts';
import type { ParsedRecord, SourceKey, SourceManifest, ValidationReport } from './types.ts';

const repoRoot = resolve(import.meta.dirname, '../../..');
const manifestPath = resolve(repoRoot, 'scripts/college-data/manifests/foundation-sources.json');
const args = process.argv.slice(2);
const command = args[0];

function option(name: string, required = false): string | undefined {
  const index = args.indexOf(`--${name}`);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (required && (!value || value.startsWith('--'))) throw new Error(`--${name} is required`);
  return value;
}

function flag(name: string) { return args.includes(`--${name}`); }

function sourceSelection() {
  const source = option('source', true) as SourceKey;
  return { source, manifest: readManifest(manifestPath, source) };
}

async function validate(source: SourceKey, manifest: SourceManifest, artifact: string) {
  await verifyArtifact(manifest, artifact);
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  const rejectionReasons: Record<string, number> = {};
  let rowsRead = 0, rowsAccepted = 0, eligibleRows = 0, metricRows = 0, suppressedMetricRows = 0;
  let headersChecked = false;
  for await (const raw of csvRecords(manifest, artifact)) {
    rowsRead += 1;
    if (!headersChecked) {
      const headers = new Set(Object.keys(raw).map((key) => key.replace(/^\uFEFF/, '')));
      const missing = requiredHeaders(manifest.parser).filter((header) => !headers.has(header));
      if (missing.length) throw new Error(`schema drift: missing ${missing.join(', ')}`);
      headersChecked = true;
    }
    try {
      const parsed = parseSourceRecord(raw, manifest);
      if (seen.has(parsed.institution.unitid)) duplicates.add(parsed.institution.unitid);
      seen.add(parsed.institution.unitid);
      rowsAccepted += 1;
      if (parsed.institution.isEligible) eligibleRows += 1;
      metricRows += parsed.metrics.length;
      suppressedMetricRows += parsed.metrics.filter((metric) => metric.isSuppressed).length;
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError';
      rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + 1;
    }
  }
  const report: ValidationReport = {
    source, rowsRead, rowsAccepted, rowsRejected: rowsRead - rowsAccepted,
    eligibleRows, metricRows, suppressedMetricRows,
    duplicateUnitids: [...duplicates].sort((a, b) => a - b), rejectionReasons
  };
  if (!headersChecked) throw new Error('source contained no records');
  if (duplicates.size) throw new Error(`duplicate UNITID values: ${[...duplicates].slice(0, 10).join(', ')}`);
  if (report.rowsRead !== report.rowsAccepted + report.rowsRejected) {
    throw new Error('accepted/rejected counts do not reconcile');
  }
  return report;
}

function databaseUrl() {
  const value = process.env.COLLEGE_DATABASE_URL;
  if (!value) throw new Error('COLLEGE_DATABASE_URL is required');
  return value;
}

function psql(sql: string, variables: Record<string, string> = {}) {
  const cliArgs = [databaseUrl(), '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'];
  for (const [key, value] of Object.entries(variables)) cliArgs.push('-v', `${key}=${value}`);
  return execFileSync('psql', cliArgs, { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function pipelineBuildId() {
  const commit = process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const manifestHash = createHash('sha256').update(readFileSync(manifestPath)).digest('hex').slice(0, 16);
  return `${commit}:${manifestHash}`;
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function institutionCsv(jobId: string, record: ParsedRecord) {
  const row = record.institution;
  return [jobId, row.sourceRecordLocator, row.unitid, row.officialName, row.status,
    row.institutionLevel, row.ownership, row.city, row.state, row.zip, row.latitude,
    row.longitude, row.websiteUrl, row.isEligible].map(csvCell).join(',') + '\n';
}

function metricCsv(jobId: string, metric: ParsedRecord['metrics'][number]) {
  return [jobId, metric.sourceRecordLocator, metric.unitid, metric.metricKey,
    metric.academicYear, metric.cohortKey, metric.valueNumeric, metric.unit,
    metric.isSuppressed].map(csvCell).join(',') + '\n';
}

async function writeWithBackpressure(stream: NodeJS.WritableStream, value: string) {
  if (!stream.write(value)) await once(stream, 'drain');
}

function createJob(manifest: SourceManifest, report: ValidationReport) {
  const result = psql(`
with source_row as (
  insert into public.data_sources (source_key, producer_name, dataset_name, homepage_url)
  values (:'source_key', :'producer_name', :'dataset_name', :'homepage_url')
  on conflict (source_key) do update set source_key = excluded.source_key
  returning id
), source_id as (
  select id from source_row union all
  select id from public.data_sources where source_key = :'source_key' limit 1
), release_row as (
  insert into public.data_releases (
    data_source_id, source_release_name, release_type, source_url,
    source_published_at, retrieved_at, sha256, object_path, schema_version, metadata
  ) select id, :'release_name', :'release_type', :'source_url',
    :'published_at'::timestamptz, :'retrieved_at'::timestamptz, :'sha256',
    :'object_path', :'schema_version', jsonb_build_object('manifest_version', 1)
  from source_id
  on conflict (data_source_id, sha256) do nothing
  returning id
), release_id as (
  select id from release_row union all
  select dr.id from public.data_releases dr join source_id ds on ds.id = dr.data_source_id
  where dr.sha256 = :'sha256' limit 1
), job_row as (
  insert into college_ingest.ingestion_jobs (
    release_id, pipeline_build_id, status, started_at, validation_summary
  ) select id, :'pipeline_build_id', 'validating', now(), :'validation_summary'::jsonb
  from release_id
  on conflict (release_id, pipeline_build_id) do nothing
  returning id, status
), target_job as (
  select id, status from job_row union all
  select j.id, j.status from college_ingest.ingestion_jobs j join release_id r on r.id = j.release_id
  where j.pipeline_build_id = :'pipeline_build_id' limit 1
), attempt_row as (
  insert into college_ingest.ingestion_attempts (ingestion_job_id, attempt_number)
  select id, coalesce((select max(attempt_number) + 1 from college_ingest.ingestion_attempts a where a.ingestion_job_id = target_job.id), 1)
  from target_job where status <> 'succeeded'
  returning id
)
select target_job.id || '|' || coalesce((select id::text from attempt_row), '') || '|' || target_job.status
from target_job;`, {
    source_key: manifest.sourceKey, producer_name: manifest.producerName,
    dataset_name: manifest.datasetName, homepage_url: manifest.homepageUrl,
    release_name: manifest.releaseName, release_type: manifest.releaseType,
    source_url: manifest.sourceUrl, published_at: manifest.sourcePublishedAt,
    retrieved_at: new Date().toISOString(), sha256: manifest.sha256,
    object_path: manifest.objectPath, schema_version: manifest.schemaVersion,
    pipeline_build_id: pipelineBuildId(), validation_summary: JSON.stringify(report)
  });
  const [jobId, attemptId, status] = result.split('|');
  return { jobId, attemptId, status };
}

async function copyLoad(manifest: SourceManifest, artifact: string, report: ValidationReport, jobId: string, attemptId: string) {
  const child = spawn('psql', [databaseUrl(), '-X', '-q', '-v', 'ON_ERROR_STOP=1'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  await writeWithBackpressure(child.stdin, `begin;\ndelete from college_ingest.staged_metric_facts where ingestion_job_id = '${jobId}'::uuid;\ndelete from college_ingest.staged_institutions where ingestion_job_id = '${jobId}'::uuid;\ncopy college_ingest.staged_institutions (ingestion_job_id,source_record_locator,unitid,official_name,status,institution_level,ownership,city,state,zip,latitude,longitude,website_url,is_eligible) from stdin with (format csv);\n`);
  for await (const raw of csvRecords(manifest, artifact)) {
    await writeWithBackpressure(child.stdin, institutionCsv(jobId, parseSourceRecord(raw, manifest)));
  }
  await writeWithBackpressure(child.stdin, `\\.\ncopy college_ingest.staged_metric_facts (ingestion_job_id,source_record_locator,unitid,metric_key,academic_year,cohort_key,value_numeric,unit,is_suppressed) from stdin with (format csv);\n`);
  for await (const raw of csvRecords(manifest, artifact)) {
    for (const metric of parseSourceRecord(raw, manifest).metrics) {
      await writeWithBackpressure(child.stdin, metricCsv(jobId, metric));
    }
  }
  await writeWithBackpressure(child.stdin, `\\.\nupdate college_ingest.ingestion_jobs set rows_read=${report.rowsRead}, rows_accepted=${report.rowsAccepted}, rows_rejected=${report.rowsRejected}, status='validating' where id='${jobId}'::uuid;\nupdate college_ingest.ingestion_attempts set status='succeeded', finished_at=now(), diagnostic_summary=jsonb_build_object('rows_read',${report.rowsRead},'metric_rows',${report.metricRows}) where id='${attemptId}'::uuid;\ncommit;\n`);
  child.stdin.end();
  const [code] = await once(child, 'close') as [number];
  if (code !== 0) throw new Error(`transactional COPY failed: ${stderr.trim()}`);
}

async function main() {
  if (command === 'download') {
    const { manifest } = sourceSelection();
    const output = resolve(option('output', true)!);
    if (existsSync(output)) throw new Error(`refusing to overwrite ${output}`);
    await downloadArtifact(manifest, output);
    const storage = flag('upload') ? await storeArtifact(manifest, output, repoRoot) : 'not_requested';
    console.log(JSON.stringify({ status: 'verified', storage, output, bytes: manifest.bytes, sha256: manifest.sha256 }, null, 2));
    return;
  }
  if (command === 'store') {
    const { manifest } = sourceSelection();
    const artifact = resolve(option('artifact', true)!);
    await verifyArtifact(manifest, artifact);
    console.log(JSON.stringify({ status: await storeArtifact(manifest, artifact, repoRoot) }, null, 2));
    return;
  }
  if (command === 'validate' || command === 'load') {
    const { source, manifest } = sourceSelection();
    const artifact = resolve(option('artifact', true)!);
    const report = await validate(source, manifest, artifact);
    if (command === 'validate' || flag('dry-run')) {
      console.log(JSON.stringify({ status: 'valid', dryRun: flag('dry-run'), ...report }, null, 2));
      return;
    }
    const job = createJob(manifest, report);
    if (job.status === 'succeeded') {
      console.log(JSON.stringify({ status: 'already_succeeded', jobId: job.jobId }, null, 2));
      return;
    }
    try {
      await copyLoad(manifest, artifact, report, job.jobId, job.attemptId);
      console.log(JSON.stringify({ status: 'loaded', jobId: job.jobId, attemptId: job.attemptId, ...report }, null, 2));
    } catch (error) {
      psql(`update college_ingest.ingestion_jobs set status='failed', finished_at=now(), error_summary=:'message' where id=:'job_id'::uuid; update college_ingest.ingestion_attempts set status='failed', finished_at=now(), diagnostic_summary=jsonb_build_object('error', :'message') where id=:'attempt_id'::uuid;`, {
        message: error instanceof Error ? error.message.slice(0, 1000) : 'unknown error', job_id: job.jobId, attempt_id: job.attemptId
      });
      throw error;
    }
    return;
  }
  if (command === 'promote') {
    const jobId = option('job-id', true)!;
    console.log(psql(`select college_ingest.promote_ingestion_job(:'job_id'::uuid);`, { job_id: jobId }));
    return;
  }
  if (command === 'audit') {
    const jobId = option('job-id', true)!;
    console.log(psql(`select jsonb_pretty(jsonb_build_object('job', to_jsonb(j), 'attempts', coalesce((select jsonb_agg(to_jsonb(a) order by a.attempt_number) from college_ingest.ingestion_attempts a where a.ingestion_job_id=j.id), '[]'::jsonb), 'staged_institutions', (select count(*) from college_ingest.staged_institutions s where s.ingestion_job_id=j.id), 'staged_metrics', (select count(*) from college_ingest.staged_metric_facts m where m.ingestion_job_id=j.id))) from college_ingest.ingestion_jobs j where j.id=:'job_id'::uuid;`, { job_id: jobId }));
    return;
  }
  if (command === 'project') {
    const buildId = option('build-id', true)!;
    const fieldManifestVersion = option('field-manifest-version', true)!;
    console.log(psql(`select college_ingest.build_college_projection(:'build_id', :'field_manifest_version');`, {
      build_id: buildId, field_manifest_version: fieldManifestVersion
    }));
    return;
  }
  if (command === 'activate-projection') {
    const projectionVersionId = option('projection-version-id', true)!;
    console.log(psql(`select college_ingest.activate_college_projection(:'projection_version_id'::uuid);`, {
      projection_version_id: projectionVersionId
    }));
    return;
  }
  throw new Error('usage: foundation-ingest <download|store|validate|load|promote|audit|project|activate-projection> ...');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
