require('dotenv').config();
const axios = require('axios');
const pool = require('../config/db');

// --------------- configuration ---------------
const UNIT = 'days';
const INTERVAL = '1';
const CONCURRENCY = 5; // parallel API requests at a time
const DELAY_MS = 300; // delay between batches to avoid rate-limiting

// 6-month window ending today (March 8 2026)
function getDateRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);

  const fmt = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
  return { fromDate: fmt(from), toDate: fmt(to) };
}

// --------------- Upstox fetch ----------------
async function fetchCandles(instrumentKey, fromDate, toDate) {
  const encoded = encodeURIComponent(instrumentKey);
  const url = `https://api.upstox.com/v3/historical-candle/${encoded}/${UNIT}/${INTERVAL}/${toDate}/${fromDate}`;

  const { data } = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (data.status !== 'success' || !data.data?.candles) {
    throw new Error(`Unexpected response for ${instrumentKey}`);
  }

  return data.data.candles; // [[timestamp, open, high, low, close, volume, oi], ...]
}

// --------------- DB insert -------------------
const INSERT_QUERY = `
  INSERT INTO stock_data (time, symbol, open, high, low, close, volume)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT DO NOTHING
`;

async function insertCandles(client, symbol, candles) {
  for (const c of candles) {
    // c = [timestamp, open, high, low, close, volume, open_interest]
    const [time, open, high, low, close, volume] = c;
    await client.query(INSERT_QUERY, [time, symbol, open, high, low, close, volume]);
  }
}

// --------------- helpers ---------------------
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --------------- main ------------------------
async function main() {
  const { fromDate, toDate } = getDateRange();
  console.log(`Fetching daily candles from ${fromDate} to ${toDate}\n`);

  // 1. Get all companies
  const { rows: companies } = await pool.query(
    'SELECT symbol, instrument_key FROM companies'
  );
  console.log(`Found ${companies.length} companies in the database.\n`);

  const client = await pool.connect();
  let successCount = 0;
  let failCount = 0;

  try {
    await client.query('BEGIN');

    // Process companies in batches for controlled concurrency
    for (let i = 0; i < companies.length; i += CONCURRENCY) {
      const batch = companies.slice(i, i + CONCURRENCY);

      const results = await Promise.allSettled(
        batch.map(async (company) => {
          const candles = await fetchCandles(company.instrument_key, fromDate, toDate);
          await insertCandles(client, company.symbol, candles);
          return { symbol: company.symbol, count: candles.length };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          successCount++;
          console.log(`  ✓ ${r.value.symbol} — ${r.value.count} candles inserted`);
        } else {
          failCount++;
          console.error(`  ✗ Error: ${r.reason.message}`);
        }
      }

      // Small delay between batches to be gentle on the API
      if (i + CONCURRENCY < companies.length) {
        await sleep(DELAY_MS);
      }
    }

    await client.query('COMMIT');
    console.log(
      `\nDone. Success: ${successCount}, Failed: ${failCount} out of ${companies.length} companies.`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed, rolled back:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
