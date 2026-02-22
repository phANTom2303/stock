const pool = require('#/config/db.js')

async function fetchStockData(req,res) {
    try{
        const{company_symbol, start_date, end_date} = req.query;

        if(!company_symbol || !start_date || !end_date){
            return res.status(400).json({
                success: false,
                message: "All fields required"
            });
        }

        const query = `SELECT time,
                              open, high, low, close
                              FROM stock_data
                              WHERE symbol =  $1
                              AND time BETWEEN $2 and $3
                              ORDER BY time ASC`;
        
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