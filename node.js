const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./server/middleware/logger');
const cookieParser = require('cookie-parser');
const response = require('./server/utils/response.utils');
const RESPONSE_STATUS = require('./server/utils/standard.messages');
const apiRoutes = require('./server/routes/apiRoutes');
const dbConfig = require('./server/config/db.config');
const expressSession = require('express-session');
const mySqlStore = require('express-mysql-session')(expressSession);
require('./server/utils/schedule.utils');

// creating express app
const app = express();

// content security policy 
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],
                imgSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                fontSrc: ["'self'"],
                connectSrc: ["'self'"],
                mediaSrc: ["'self'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"]
            }
        }
    })
);


const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000',];
// cors setup
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'access-token', 'x-file-name'],
    exposedHeaders: ['access-token', 'new-access-token'],
    credentials: true,
    maxAge: 18000 // 30 minutes
};

// enable cors
app.use(cors(corsOptions));

// middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'server/public')));
app.use(logger);

// Wait for teh database to connect 
async function makeSureDbConnected() {
    try {
        const connection = await dbConfig.pool.getConnection();
        console.log('Database connected successfully and ready to use!');
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
}, dbConfig.pool);

// express session middleware setup
const sessionConfig = {
    store: sessionStore,
    rolling: true,
    secret: process.env.EXPRESS_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'milk-nest-cookie',
    cookie: {
        maxAge: Number(process.env.EXPRESS_SESSION_EXPIRES),
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
app.use('/apiv1', apiRoutes);
// handling unknown roots
app.all('*splat', (req, res) => {
    console.log('In Global Router handler function');
    response.sendErrorResponse(req, res, 'Requested resource not available :' + req.originalUrl, RESPONSE_STATUS.NOT_FOUND, { function: 'global route handler' });
});

// global error handling
app.use((error, req, res, next) => {
    console.log('In Global error handler : ', error);
    response.sendErrorResponse(req, res, 'Unable to process request. please try after some time !', RESPONSE_STATUS.INTERNAL_SERVER_ERROR, { location: 'Global error' })
});

module.exports = { app };