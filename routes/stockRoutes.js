const express = require('express');
const stockRouter = express.Router();

const {handleGetCompanyList} = require('#controllers/companyList.js');
const {fetchStockData}       = require('#controllers/stock_data.js');

stockRouter.get("/get_company_list", handleGetCompanyList);
stockRouter.get("/get_stock_data", fetchStockData);

module.exports = stockRouter;