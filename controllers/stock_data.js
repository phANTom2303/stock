const pool = require('#config/db.js');
const axios = require('axios');

const UPSTOX_BASE_URL = 'https://api.upstox.com/v3/historical-candle';

async function fetchStockData(req, res) {
    try {
        const {
            company_symbol,
            start_date,
            end_date,
            unit = 'days',
            interval = '1',
        } = req.query;

        if (!company_symbol || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: "company_symbol, start_date, and end_date are required",
            });
        }

        // Look up the instrument key from the companies table
        const companyResult = await pool.query(
            'SELECT instrument_key FROM companies WHERE symbol = $1',
            [company_symbol]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Company with symbol '${company_symbol}' not found`,
            });
        }

        const instrumentKey = companyResult.rows[0].instrument_key;
        const encodedKey = encodeURIComponent(instrumentKey);

        // Call the Upstox historical candle API
        const url = `${UPSTOX_BASE_URL}/${encodedKey}/${unit}/${interval}/${end_date}/${start_date}`;

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        const candles = response.data?.data?.candles;

        if (!candles || candles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No stock data found for the given period",
            });
        }

        // Map candle arrays to labeled objects
        const data = candles.map((c) => ({
            time: c[0],
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4],
            volume: c[5],
            open_interest: c[6],
        }));

        return res.status(200).json({
            success: true,
            symbol: company_symbol,
            instrument_key: instrumentKey,
            data,
        });
    } catch (error) {
        console.error("Error:", error?.response?.data || error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.message || "Upstox API error",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}

module.exports = {
    fetchStockData,
};