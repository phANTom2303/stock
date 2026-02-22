require('dotenv').config();
const express = require('express');
const app = express();

//Router imports:
const stockRouter = require('#routes/stockRoutes.js')
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req,res) => {
    res.json({status: 'Server is running'});
});

app.use('/stocks', stockRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});