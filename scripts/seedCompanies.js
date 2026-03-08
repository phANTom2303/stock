require('dotenv').config();
const pool = require('../config/db');
const companies = require('../SEED_COMPANY.json');

const INSERT_QUERY = `
  INSERT INTO companies (
    symbol, company_name, exchange, segment, instrument_type,
    instrument_key, isin, exchange_token, trading_symbol,
    short_name, lot_size, tick_size, freeze_quantity, live_support
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  ON CONFLICT (instrument_key) DO NOTHING
`;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const c of companies) {
      await client.query(INSERT_QUERY, [
        c.trading_symbol,    // symbol
        c.name,              // company_name
        c.exchange,          // exchange
        c.segment,           // segment
        c.instrument_type,   // instrument_type
        c.instrument_key,    // instrument_key
        c.isin,              // isin
        c.exchange_token,    // exchange_token
        c.trading_symbol,    // trading_symbol
        c.short_name,        // short_name
        c.lot_size,          // lot_size
        c.tick_size,         // tick_size
        c.freeze_quantity,   // freeze_quantity
        false,               // live_support
      ]);
    }

    await client.query('COMMIT');
    console.log(`Inserted ${companies.length} companies successfully.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
