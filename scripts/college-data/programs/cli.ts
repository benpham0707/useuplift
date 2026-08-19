#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { parse } from 'csv-parse';
import { aggregateProgramAreas } from './parser.ts';

const repoRoot = resolve(import.meta.dirname, '../../..');
const manifest = JSON.parse(readFileSync(resolve(repoRoot, 'scripts/college-data/manifests/ipeds-2023-final.json'), 'utf8'));
const source = manifest.artifacts.find((artifact: { id: string }) => artifact.id === 'C2023_A');
if (!source) throw new Error('C2023_A is missing from the IPEDS manifest');

const args = process.argv.slice(2);
const command = args[0];
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const artifact = option('artifact');
if (!artifact) throw new Error('--artifact is required');
const artifactPath = resolve(artifact);

function databaseUrl() {
  if (!process.env.COLLEGE_DATABASE_URL) throw new Error('COLLEGE_DATABASE_URL is required');
  return process.env.COLLEGE_DATABASE_URL;
}

function psql(sql: string, variables: Record<string, string> = {}) {
  const cliArgs = [databaseUrl(), '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'];
  for (const [key, value] of Object.entries(variables)) cliArgs.push('-v', `${key}=${value}`);
  return execFileSync('psql', cliArgs, { input: sql, encoding: 'utf8' }).trim();
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

async function verifyAndParse() {
  const bytes = readFileSync(artifactPath);
  if (bytes.byteLength !== source.bytes) throw new Error(`byte drift: expected ${source.bytes}, received ${bytes.byteLength}`);
  const checksum = createHash('sha256').update(bytes).digest('hex');
  if (checksum !== source.sha256) throw new Error('checksum drift for C2023_A');

  const unzip = spawn('unzip', ['-p', artifactPath, source.members[0]], { stdio: ['ignore', 'pipe', 'pipe'] });
  const parser = unzip.stdout.pipe(parse({ bom: true, columns: true, skip_empty_lines: true }));
  const rows: Record<string, string>[] = [];
  for await (const row of parser) rows.push(row as Record<string, string>);
  const [code] = await once(unzip, 'close') as [number];
  if (code !== 0) throw new Error('unable to extract C2023_A');
  return { rowsRead: rows.length, programs: aggregateProgramAreas(rows) };
}

async function load(programs: ReturnType<typeof aggregateProgramAreas>) {
  const releaseId = psql(`
with source_row as (
  insert into public.data_sources (source_key, producer_name, dataset_name, homepage_url)
  values ('ipeds_completions', 'NCES', 'IPEDS Completions', 'https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx')
  on conflict (source_key) do update set dataset_name = excluded.dataset_name
  returning id
), source_id as (
  select id from source_row union all
  select id from public.data_sources where source_key = 'ipeds_completions' limit 1
), release_row as (
  insert into public.data_releases (
    data_source_id, source_release_name, release_type, source_url,
    source_published_at, retrieved_at, sha256, object_path, schema_version, metadata
  ) select id, 'C2023_A', 'final', :'source_url', null, now(),
    :'sha256', :'object_path', '2023', jsonb_build_object('academic_year', 2023, 'award_level', 5)
  from source_id
  on conflict (data_source_id, sha256) do nothing
  returning id
)
select id from release_row union all
select release.id from public.data_releases release join source_id on source_id.id = release.data_source_id
where release.sha256 = :'sha256' limit 1;`, {
    source_url: source.sourceUrl, sha256: source.sha256, object_path: source.storagePath,
  });

  const child = spawn('psql', [databaseUrl(), '-X', '-q', '-v', 'ON_ERROR_STOP=1'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.stdin.write(`begin;\ncreate temporary table program_import (unitid integer, cip_area_code text, cip_area_label text, completions integer) on commit drop;\ncopy program_import from stdin with (format csv);\n`);
  for (const program of programs) {
    child.stdin.write([program.unitid, program.cipAreaCode, program.cipAreaLabel, program.completions].map(csvCell).join(',') + '\n');
  }
  child.stdin.end(`\\.\ninsert into public.college_program_areas (institution_id, release_id, academic_year, cip_area_code, cip_area_label, completions)\nselect institution.id, '${releaseId}'::uuid, 2023, import.cip_area_code, import.cip_area_label, import.completions\nfrom program_import import join public.institutions institution on institution.unitid = import.unitid\non conflict (institution_id, release_id, academic_year, cip_area_code) do update\nset cip_area_label = excluded.cip_area_label, completions = excluded.completions;\ninsert into public.projection_version_releases (projection_version_id, release_id)\nselect active_projection_version_id, '${releaseId}'::uuid from public.projection_control where singleton and active_projection_version_id is not null\non conflict do nothing;\nselect public.refresh_college_program_areas();\ncommit;\n`);
  const [code] = await once(child, 'close') as [number];
  if (code !== 0) throw new Error(`program load failed: ${stderr.trim()}`);
  return releaseId;
}

const parsed = await verifyAndParse();
if (command === 'validate') {
  console.log(JSON.stringify({ status: 'valid', rowsRead: parsed.rowsRead, programAreas: parsed.programs.length }, null, 2));
} else if (command === 'load') {
  console.log(JSON.stringify({ status: 'loaded', releaseId: await load(parsed.programs), rowsRead: parsed.rowsRead, programAreas: parsed.programs.length }, null, 2));
} else {
  throw new Error('usage: programs <validate|load> --artifact <C2023_A.zip>');
}
