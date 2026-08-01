import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, createWriteStream, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { once } from 'node:events';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse } from 'csv-parse';
import type { SourceManifest } from './types.ts';

export async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function downloadArtifact(manifest: SourceManifest, output: string) {
  const response = await fetch(manifest.sourceUrl, { redirect: 'follow' });
  if (!response.ok || !response.body) throw new Error(`download failed: HTTP ${response.status}`);
  const writer = createWriteStream(output, { flags: 'wx' });
  try {
    for await (const chunk of response.body) {
      if (!writer.write(chunk)) await once(writer, 'drain');
    }
    writer.end();
    await once(writer, 'close');
  } catch (error) {
    writer.destroy();
    throw error;
  }
  await verifyArtifact(manifest, output);
}

export async function verifyArtifact(manifest: SourceManifest, path: string) {
  const bytes = statSync(path).size;
  if (bytes !== manifest.bytes) throw new Error(`byte drift: expected ${manifest.bytes}, received ${bytes}`);
  const checksum = await sha256File(path);
  if (checksum !== manifest.sha256) throw new Error(`checksum drift for ${manifest.releaseName}`);
  const zip = spawnSync('unzip', ['-t', path], { encoding: 'utf8' });
  if (zip.status !== 0) throw new Error(`ZIP integrity failed: ${zip.stderr}`);
  const members = spawnSync('unzip', ['-Z1', path], { encoding: 'utf8' });
  if (members.status !== 0 || !members.stdout.split('\n').includes(manifest.member)) {
    throw new Error(`expected ZIP member missing: ${manifest.member}`);
  }
}

export async function* csvRecords(manifest: SourceManifest, path: string) {
  const unzip = spawn('unzip', ['-p', path, manifest.member], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  unzip.stderr.setEncoding('utf8');
  unzip.stderr.on('data', (chunk) => { stderr += chunk; });
  const parser = unzip.stdout.pipe(parse({
    bom: true, columns: true, relax_column_count: false, skip_empty_lines: true,
    max_record_size: 8 * 1024 * 1024
  }));
  for await (const record of parser) yield record as Record<string, string>;
  const [code] = await once(unzip, 'close') as [number];
  if (code !== 0) throw new Error(`unzip failed: ${stderr.trim()}`);
}

export function readManifest(path: string, source: string): SourceManifest {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as {
    manifestVersion: number; sources: Record<string, SourceManifest>
  };
  if (parsed.manifestVersion !== 1 || !parsed.sources[source]) {
    throw new Error(`unknown source ${source}`);
  }
  return parsed.sources[source];
}

export async function storeArtifact(manifest: SourceManifest, path: string, repoRoot: string) {
  const foundation = JSON.parse(readFileSync(
    join(repoRoot, 'scripts/college-data/manifests/foundation-sources.json'), 'utf8'
  )) as { requiredProjectRef: string; bucket: string };
  const linkedRef = readFileSync(
    join(repoRoot, 'infra/college-foundation/supabase/.temp/project-ref'), 'utf8'
  ).trim();
  if (linkedRef !== foundation.requiredProjectRef) {
    throw new Error(`refusing storage operation against ${linkedRef}`);
  }
  const directory = mkdtempSync(join(tmpdir(), 'uplift-foundation-storage-'));
  const existing = join(directory, 'existing.zip');
  const remote = `ss:///${foundation.bucket}/${manifest.objectPath}`;
  const baseArgs = ['--workdir', 'infra/college-foundation', '--experimental', 'storage', 'cp', '--linked'];
  try {
    const download = spawnSync('supabase', [...baseArgs, remote, existing], {
      cwd: repoRoot, encoding: 'utf8', stdio: 'ignore'
    });
    if (download.status === 0) {
      await verifyArtifact(manifest, existing);
      return 'already_present';
    }
    const upload = spawnSync('supabase', [
      ...baseArgs, '--content-type', 'application/zip', path, remote
    ], { cwd: repoRoot, encoding: 'utf8' });
    if (upload.status !== 0) throw new Error(`storage upload failed: ${upload.stderr}`);
    const roundTrip = spawnSync('supabase', [...baseArgs, remote, existing], {
      cwd: repoRoot, encoding: 'utf8'
    });
    if (roundTrip.status !== 0) throw new Error(`storage round trip failed: ${roundTrip.stderr}`);
    await verifyArtifact(manifest, existing);
    return 'uploaded';
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
