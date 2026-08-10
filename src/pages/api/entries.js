import { put, list } from '@vercel/blob';

export const prerender = false;

const BLOB_PATH = 'leanbulk/entries.json';

async function readEntries() {
  const { blobs } = await list({ prefix: BLOB_PATH });
  const match = blobs.find((b) => b.pathname === BLOB_PATH);
  if (!match) return [];
  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

async function writeEntries(entries) {
  await put(BLOB_PATH, JSON.stringify(entries), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  });
}

export async function GET() {
  const entries = await readEntries();
  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }) {
  const body = await request.json();
  const { date, weight, calories, protein, fat } = body;

  if (!date || typeof weight !== 'number' || weight <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid entry' }), { status: 400 });
  }

  const entries = await readEntries();
  const withoutSameDate = entries.filter((e) => e.date !== date);
  const next = [...withoutSameDate, { date, weight, calories: calories ?? null, protein: protein ?? null, fat: fat ?? null }].sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  await writeEntries(next);
  return new Response(JSON.stringify(next), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE({ request }) {
  const { date } = await request.json();
  const entries = await readEntries();
  const next = entries.filter((e) => e.date !== date);
  await writeEntries(next);
  return new Response(JSON.stringify(next), {
    headers: { 'Content-Type': 'application/json' },
  });
}
