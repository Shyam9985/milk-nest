const express = require('express');
const app = express();
const path = require('path');
const logger = require('./utilities/logger');


app.use(logger);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
module.exports = { app };