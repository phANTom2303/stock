require('dotenv').config();
//console.log('DATABASE_URL:', process.env.DATABASE_URL);
const pool = require('#config/db.js');

async function test() {
    try {
        const company_symbol = 'RELIANCE';
        const start_date = '2024-06-01';
        const end_date = '2024-06-05';

        const query = `
            SELECT time, open, high, low, close
            FROM stock_data
            WHERE symbol = $1
            AND time BETWEEN $2 AND $3
            ORDER BY time ASC
        `;

        const values = [company_symbol, start_date, end_date];
        const result = await pool.query(query, values);

        console.log("Result:");
        console.log(result.rows);

        process.exit(); // exit after running
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();