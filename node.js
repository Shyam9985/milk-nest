const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const cookieParser = require('cookie-parser');
const response = require('./utilities/response.utils');
const RESPONSE_STATUS = require('./utilities/standard.messages');

// creting express app
const app = express();

// middlewares
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

app.use('/shyam', (req, res) => {

    response.sendSuccessResponse(req, res, [{ name: 'shyam', phone: 9985453023 }], RESPONSE_STATUS.DATA_FOUND, {})
})

// handling unknown roots
app.all('*splat', (req, res) => {
    console.log('In Global Router handler function')
    res.status(500).json({
        success: 'false',
        message: 'Requested route not available :' + req.originalUrl,
        data: []
    })
});

// global error handling
app.use((error, req, res, next) => {
    console.log('In Global error handler');
    response.sendErrorResponse(req, res, RESPONSE_STATUS.INTERNAL_SERVER_ERROR, { location: 'Gloal error' })
});
module.exports = { app };