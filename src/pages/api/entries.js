import { put, list } from '@vercel/blob';

export const prerender = false;

const BLOB_PATH = 'leanbulk/entries.json';
const BLOB_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN;

async function readEntries() {
  const { blobs } = await list({ token: BLOB_TOKEN });

  // Sort by uploadedAt descending to get the freshest one first
  const sortedBlobs = blobs
    .filter((b) => b.pathname === BLOB_PATH)
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  const match = sortedBlobs[0];

  if (!match) {
    console.log('No blob found for path:', BLOB_PATH);
    return [];
  }

  const res = await fetch(match.url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data;
}

async function writeEntries(entries) {
  const blob = await put(BLOB_PATH, JSON.stringify(entries), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    token: BLOB_TOKEN,
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
  const { date, weight, calories } = body;

  const entries = await readEntries();

  const withoutSameDate = entries.filter((e) => e.date !== date);
  const next = [...withoutSameDate, {
    date,
    weight,
    calories: calories ?? "Střední",
  }].sort((a, b) => a.date.localeCompare(b.date));

  await writeEntries(next);

  return new Response(JSON.stringify(next), {
    headers: { "Content-Type": "application/json" },
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
