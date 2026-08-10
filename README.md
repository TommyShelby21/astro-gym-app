# Lean Bulk Log

FULL AI appka. Astro + React tracker pro sledování váhy, kalorií a bílkovin s automatickým
doporučením, kdy přidat/ubrat kalorie. Data se ukládají jako JSON přes
Vercel Blob storage.

## Lokální vývoj

```bash
npm install
npm run dev
```

API routes (`/api/entries`, `/api/targets`) potřebují `BLOB_READ_WRITE_TOKEN`
i lokálně — viz níže, jak ho získat.

## Nasazení na Vercel

1. **Push do GitHubu** — založ repo a nahraj tenhle projekt.
2. Na [vercel.com](https://vercel.com) klikni **Add New → Project** a
   naimportuj repo. Framework preset by se měl poznat jako Astro automaticky.
3. **Přidej Blob storage:** v projektu jdi do záložky **Storage → Create
   Database → Blob**. Vercel ti automaticky nastaví proměnnou prostředí
   `BLOB_READ_WRITE_TOKEN` pro produkci i preview.
4. Klikni **Deploy**. Hotovo — appka poběží na `https://tvuj-projekt.vercel.app`.
5. Pro lokální vývoj: `vercel env pull .env.local` (stáhne token z kroku 3),
   nebo si token zkopíruj ručně ze Storage tabu do `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   ```

## Náklady

Hobby plán (zdarma, jen pro nekomerční osobní použití) — 100GB provoz,
1M function invocations/měsíc. Blob storage free tier: 1GB úložiště,
10GB přenos/měsíc. Tenhle tracker generuje řádově kilobajty JSONu, takže
se do free tieru vejdeš s obrovskou rezervou.

## Poznámka k datům

Všechna data (tvoje váhy, kalorie, cíle) jsou veřejně čitelná přes URL
blobu (`access: 'public'`), i když URL sama je náhodně generovaná a
nikde neuvedená. Pro čistě osobní tracker je to v pohodě; kdybys chtěl
appku sdílet s víc lidmi nebo zveřejnit odkaz, zvaž autentizaci
(např. Vercel middleware s heslem, nebo přechod na `access: 'private'`
s podepsanými URL).
