require('dotenv').config();
const pg = require('pg');

const DB_URL = process.env.DATABASE_URL;

async function main() {
  const { Client } = pg;
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    const extensions = await client.query('select extname, extversion from pg_extension', []);
    extensions.rows.forEach(e => {
      console.log(e)
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end()
  }
}

main()