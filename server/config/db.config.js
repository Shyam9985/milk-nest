const mysql = require('mysql2/promise');
const fs = require('fs');

// DB_HOST=mysql-1894a330-dairy-form.l.aivencloud.com
// DB_PORT=19628
// DB_NAME=dairy_form
const baseConfig = {
    connectionLimit: 7,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    queueLimit: 15,
    waitForConnections: true,
    ssl: {
        rejectUnauthorized: false,
        ca: fs.readFileSync('./certs/ca.pem')

    }
};

const adminPool = mysql.createPool({
    ...baseConfig,
    user: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASSWORD,
});

const operatorPool = mysql.createPool({
    ...baseConfig,
    user: process.env.OPERATOR_USER,
    password: process.env.ADMIN_PASSWORD,
});

const viewerPool = mysql.createPool({
    ...baseConfig,
    user: process.env.VIEWER_USER,
    password: process.env.VIEWER_PASSWORD,
});

const logPoolEvents = function (pool) {
    console.log('In logPoolEvents function');
    pool.on('acquire', function (connection) {
        console.log('Connection %d acquired', connection.threadId);
    })

    pool.on('connection', function (connection) {
        connection.query('SET SESSION auto_increment_increment=1')
    });

    pool.on('enqueue', function () {
        console.log('Waiting for available connection slot');
    });

    pool.on('release', function (connection) {
        console.log('Connection %d released', connection.threadId);
    });
}

module.exports = { pool: adminPool, logPoolEvents, escapeValue: mysql.escape }