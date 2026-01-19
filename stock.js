require('dotenv').config();
const axios = require('axios');
const pg = require('pg');



const API_KEY = process.env.INDIAN_API_KEY;
const BASE_URL = process.env.BASE_URL;

async function fetchAndStore(symbol) {
    const DB_URL = process.env.DATABASE_URL;
    const { Client } = pg;
    const client = new Client({ connectionString: DB_URL });
    await client.connect();

    try {
        console.log(`Fetching data for ${symbol}...`);
        const response = await axios.get(BASE_URL, {
            params: { name: symbol },
            headers: { 'x-api-key': API_KEY }
        });

        const rawData = response.data.stockDetailsReusableData;
        if (!rawData) return;


        const idquery = `select company_id from companies where company_name=$1`;
        const companyID = await client.query(idquery, [symbol]);

        const values = [
            new Date(),
            companyID,
            rawData.price,
            rawData.high,
            rawData.low
        ];

        console.log(values);

        // SQL Query to insert data into your 'stock_prices' table
        const query = `
            INSERT INTO stock_prices (time, company_id, price)
            VALUES ($1, $2, $3)
        `;

        console.log("values extracted");
        await client.query(query, values); // Execute the insert
        console.log(`Successfully stored ${symbol} data in Timescale Cloud.`);

    } finally {
    await client.end()
  }
}

fetchAndStore('Tata Steel');