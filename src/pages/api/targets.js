import { put, list } from '@vercel/blob';

export const prerender = false;

const BLOB_PATH = 'leanbulk/targets.json';
const DEFAULT_TARGETS = { calories: 'Střední' };
const BLOB_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN;

async function readTargets() {
  const { blobs } = await list({ prefix: BLOB_PATH, token: BLOB_TOKEN });
  const match = blobs.find((b) => b.pathname === BLOB_PATH);
  if (!match) return DEFAULT_TARGETS;
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
