import { put, list } from '@vercel/blob';

export const prerender = false;

const BLOB_PATH = 'leanbulk/workouts.json';
const BLOB_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN;

async function readSets() {
  const { blobs } = await list({ prefix: BLOB_PATH, token: BLOB_TOKEN });
  const match = blobs.find((b) => b.pathname === BLOB_PATH);
  if (!match) return [];
  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

async function writeSets(sets) {
  await put(BLOB_PATH, JSON.stringify(sets), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    token: BLOB_TOKEN,
  });
}

export async function GET() {
  const sets = await readSets();
  return new Response(JSON.stringify(sets), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }) {
  const body = await request.json();
  const { date, exercise, weight, reps } = body;

  if (!date || typeof exercise !== 'string' || !exercise.trim() || typeof weight !== 'number' || weight <= 0 || !Number.isInteger(reps) || reps <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid set' }), { status: 400 });
  }

  const sets = await readSets();
  const next = [
    ...sets,
    { id: crypto.randomUUID(), date, exercise: exercise.trim(), weight, reps },
  ].sort((a, b) => a.date.localeCompare(b.date));

  await writeSets(next);
  return new Response(JSON.stringify(next), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE({ request }) {
  const { id } = await request.json();
  const sets = await readSets();
  const next = sets.filter((s) => s.id !== id);
  await writeSets(next);
  return new Response(JSON.stringify(next), {
    headers: { 'Content-Type': 'application/json' },
  });
}
