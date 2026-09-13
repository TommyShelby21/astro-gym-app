import { put, list } from '@vercel/blob';

export const prerender = false;

const BLOB_PATH = 'leanbulk/targets.json';
const DEFAULT_TARGETS = { calories: 'Střední' };
const BLOB_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN;

async function readTargets() {
  console.log('--- Reading targets ---');
  const { blobs } = await list({ token: BLOB_TOKEN });
  const sortedBlobs = blobs
    .filter((b) => b.pathname === BLOB_PATH)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  const match = sortedBlobs[0];
  if (!match) return DEFAULT_TARGETS;

  console.log('Found latest targets blob:', match.url);
  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return DEFAULT_TARGETS;
  return res.json();
}


async function writeTargets(targets) {
  await put(BLOB_PATH, JSON.stringify(targets), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    token: BLOB_TOKEN,
  });
}

export async function GET() {
  const targets = await readTargets();
  return new Response(JSON.stringify(targets), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }) {
  const body = await request.json();
  const targets = {
    calories: body.calories || DEFAULT_TARGETS.calories,
  };
  await writeTargets(targets);
  return new Response(JSON.stringify(targets), {
    headers: { 'Content-Type': 'application/json' },
  });
}
