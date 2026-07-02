const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const cookieParser = require('cookie-parser');
const response = require('./utils/response.utils');
const RESPONSE_STATUS = require('./utils/standard.messages');
const apiroutes = require('./routes/apiRoutes');
const dbconfig = require('./config/db.config');
const expressSession = require('express-session');
const mySqlStore = require('express-mysql-session')(expressSession);
// creting express app
const app = express();

require('./utils/schedule.utils');

// middlewares
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

// Wait for teh database to connect 
async function makeSureDbConnected() {
    try {
        const connection = await dbconfig.pool.getConnection();
        console.log('Database connected successfully and session store created!');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}
makeSureDbConnected();

// create a session store 
const sessionStore = new mySqlStore({
    clearExpired: true,
    checkExpirationInterval: 600000,
    expiration: process.env.EXPRESS_SESSION_EXPIRES,
}, dbconfig.pool);

// express session middleware setup
const sessionConfig = {
    store: sessionStore,
    rolling: true,
    secret: process.env.EXPRESS_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'milk-nest-cookie',
    cookie: {
        maxAge: process.env.EXPRESS_SESSION_EXPIRES,
        httpOnly: true,
        sameSite: 'lax'
    }
}

if (process.env.NODE_ENV === 'production') {
    app.set('trust-proxy', 1);
    sessionConfig.cookie.secure = true;
}

app.use(expressSession(sessionConfig));

// routes 
app.use('/apiv1', apiroutes);
// handling unknown roots
app.all('*splat', (req, res) => {
    console.log('In Global Router handler function');
    response.sendErrorResponse(req, res, 'Requested resource not available :' + req.originalUrl, RESPONSE_STATUS.NOT_FOUND, { function: 'global route handler' });
});

// global error handling
app.use((error, req, res, next) => {
    console.log('In Global error handler : ', error);
    response.sendErrorResponse(req, res, 'Unable to procee request. please try after some time !', RESPONSE_STATUS.INTERNAL_SERVER_ERROR, { location: 'Gloal error' })
});
module.exports = { app };