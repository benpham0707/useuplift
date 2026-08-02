import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, '../..');
const manifestPath = resolve(
  repoRoot,
  'scripts/college-data/manifests/ipeds-2023-final.json',
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const upload = process.argv.includes('--upload');

function run(command, args, capture = false) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  }) ?? '';
}

function tryRun(command, args) {
  try {
    execFileSync(command, args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function assertManifest() {
  if (manifest.manifestVersion !== 1 || manifest.source !== 'IPEDS') {
    throw new Error('Unsupported IPEDS manifest');
  }
  const ids = new Set();
  const paths = new Set();
  for (const artifact of manifest.artifacts) {
    if (ids.has(artifact.id) || paths.has(artifact.storagePath)) {
      throw new Error(`Duplicate manifest identity/path: ${artifact.id}`);
    }
    if (!artifact.sourceUrl.startsWith('https://nces.ed.gov/ipeds/')) {
      throw new Error(`Non-NCES source URL rejected: ${artifact.sourceUrl}`);
    }
    if (!Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0) {
      throw new Error(`Invalid byte count: ${artifact.id}`);
    }
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256)) {
      throw new Error(`Invalid SHA-256: ${artifact.id}`);
    }
    ids.add(artifact.id);
    paths.add(artifact.storagePath);
  }
}

function assertTargetLink() {
  const linkedRef = readFileSync(
    resolve(repoRoot, 'supabase/.temp/project-ref'),
    'utf8',
  ).trim();
  if (linkedRef !== manifest.requiredProjectRef) {
    throw new Error(
      `Refusing remote operation: linked ${linkedRef}, expected configured target ${manifest.requiredProjectRef}`,
    );
  }
}

function verifyZipMembers(artifact, destination) {
  run('unzip', ['-t', destination], true);
  const members = run('unzip', ['-Z1', destination], true)
    .trim()
    .split('\n')
    .filter(Boolean);
  if (JSON.stringify(members) !== JSON.stringify(artifact.members)) {
    throw new Error(
      `${artifact.id} member drift: expected ${artifact.members.join(', ')}, received ${members.join(', ')}`,
    );
  }
  return destination;
}

function downloadAndVerify(artifact, directory) {
  const destination = join(directory, `${artifact.id}.zip`);
  let usedResume = false;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const size = existsSync(destination) ? statSync(destination).size : 0;
    if (size === artifact.bytes) break;
    if (size > artifact.bytes) rmSync(destination);
    const resumableSize = existsSync(destination) ? statSync(destination).size : 0;
    usedResume ||= resumableSize > 0;
    const args = [
      '--fail',
      '--location',
      '--silent',
      '--show-error',
      '--connect-timeout',
      '15',
      '--max-time',
      '60',
      ...(resumableSize > 0 ? ['--continue-at', '-'] : []),
      artifact.sourceUrl,
      '--output',
      destination,
    ];
    tryRun('curl', args);
  }

  const size = existsSync(destination) ? statSync(destination).size : 0;
  if (size !== artifact.bytes) {
    throw new Error(
      `${artifact.id} byte drift: expected ${artifact.bytes}, received ${size}`,
    );
  }
  const checksum = sha256(destination);
  if (checksum !== artifact.sha256) {
    if (usedResume) {
      rmSync(destination);
      run('curl', [
        '--fail',
        '--location',
        '--silent',
        '--show-error',
        '--connect-timeout',
        '15',
        '--max-time',
        '120',
        artifact.sourceUrl,
        '--output',
        destination,
      ]);
      if (
        statSync(destination).size === artifact.bytes &&
        sha256(destination) === artifact.sha256
      ) {
        return verifyZipMembers(artifact, destination);
      }
    }
    throw new Error(
      `${artifact.id} checksum drift: expected ${artifact.sha256}, received ${checksum}`,
    );
  }
  return verifyZipMembers(artifact, destination);
}

function uploadAndRoundTrip(artifact, localPath, directory) {
  const remote = `ss:///${manifest.bucket}/${artifact.storagePath}`;
  const existing = join(directory, `existing-${basename(localPath)}`);
  if (
    tryRun('supabase', [
      '--experimental',
      'storage',
      'cp',
      '--linked',
      remote,
      existing,
    ])
  ) {
    if (
      statSync(existing).size !== artifact.bytes ||
      sha256(existing) !== artifact.sha256
    ) {
      throw new Error(`Immutable remote object mismatch: ${artifact.id}`);
    }
    return;
  }

  run('supabase', [
    '--experimental',
    'storage',
    'cp',
    '--linked',
    '--content-type',
    'application/zip',
    localPath,
    remote,
  ]);
  const roundTrip = join(directory, `roundtrip-${basename(localPath)}`);
  run('supabase', [
    '--experimental',
    'storage',
    'cp',
    '--linked',
    remote,
    roundTrip,
  ]);
  if (
    sha256(roundTrip) !== artifact.sha256 ||
    statSync(roundTrip).size !== artifact.bytes
  ) {
    throw new Error(`Remote round-trip mismatch: ${artifact.id}`);
  }
}

assertManifest();
  if (upload) assertTargetLink();

const directory = mkdtempSync(join(tmpdir(), 'uplift-ipeds-'));
try {
  for (const artifact of manifest.artifacts) {
    process.stdout.write(`Verifying ${artifact.id}... `);
    const localPath = downloadAndVerify(artifact, directory);
    if (upload) uploadAndRoundTrip(artifact, localPath, directory);
    console.log(upload ? 'present and round-trip verified' : 'verified');
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log(
  `${manifest.source} ${manifest.releaseKey}: ${manifest.artifacts.length} immutable artifacts verified${upload ? ' in staging' : ''}.`,
);
