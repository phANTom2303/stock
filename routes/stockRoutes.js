const express = require('express');
const router = express.Router();

const {handleGetCompanyList} = require('#/controllers/companyList');
const {fetchStockData}       = require('#/controllers/stock_data');

module.exports = router;