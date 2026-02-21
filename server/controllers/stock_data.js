const pool = require('../db')

async function fetchStockData(req,res) {
    try{
        const{company_symbol, start_date, end_date} = req.query;

        if(!company_symbol || !start_date || !end_date){
            return res.status(400).json({
                success: false,
                message: "All fields required"
            });
        }

        const query = `SELECT sp.date,
                              sp.open, sp.high, sp.low, sp.close
                              FROM stock_prices sp
                              JOIN companies c
                              ON sp.company_id = c.company_id
                              WHERE c.company_symbol =  $1
                              AND sp.date BETWEEN $2 and $3
                              ORDER BY sp.date ASC`;
        
        const values = [company_symbol, start_date, end_date];
        const result = await pool.query(query,values);

        if(result.rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "No stock data found"
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    }

    catch(error){
        console.error("Error:", error);
        return res.status(500).json({
        success: false,
        message: "Server error",
    });
    }
}

module.exports = {
    fetchStockData,
};