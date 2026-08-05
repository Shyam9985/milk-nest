require('dotenv').config();

// Global unhandled exception handling
process.on('uncaughtException', (error) => {
    console.log('Unhandled Exception : ', error);
    console.log('Unhandled exception occurred. shutting down the server...');
    process.exit(1);
});

const server = require('./node');
const dbutils = require('./server/utils/db.utils');
const dbconfig = require('./server/config/db.config');

const port = process.env.PORT || 4901;


const serverVar = server.app.listen(port, 'localhost', () => {
    console.log(`Server is up and listening on ${port} to the requests...`);
}
);

// Global rejected promise handling
process.on('unhandledRejection', (error) => {
    console.log('Unhandled Rejection : ', error);
    console.log('Unhandled rejection occurred. shutting down the server...');
    serverVar.close(() => {
        process.exit(1);
    });
});
