const pool = require('#config/db.js')

async function handleGetCompanyList(req, res){
    try{
        //Fetch from db
        const query = `SELECT symbol, company_name
                       FROM companies
                       ORDER BY company_name ASC`;
        
        //Get result
        const result = await pool.query(query);

        //Check if company name exists in db
        if (result.rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "No companies available"
            });
        }

        return res.status(200).json({
            success: true,
            companies: result.rows
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
    handleGetCompanyList,
};

