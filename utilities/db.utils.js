const dbconfig = require('../config/db.config');
const dberrors = require('./db-errors')
const pool = dbconfig.pool.promise();
dbconfig.logPoolEvents(pool);

const getConnection = async () => {
    return await pool.getConnection();
};

const formatDbError = (error) => {
    console.error('Database Error:', error);
    message = dberrors.getDatabaseError(error.code)
    return message;
}
/**********************************************
*name : executeQuery
*description : executes multiple queries 
* input : ('server', 'SELECT * FROM dymmy where id = ?', [2])
************************************************/
const executeQuery = async (fname, query, params = []) => {
    console.log('in executeQuery and quries received from ' + fname);

    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        return formatDbError(error);
    } finally {
        console.log('Execution completed!');
    }
};

/**********************************************
*name : executeMultipleQueries
*description : executes multiple queries 
* input : ('server', [{ query: 'SELECT * FROM dymmy where id = ?', params: [2] }, { query: 'SELECT * FROM dymmy where id = ?', params: [1] }])
************************************************/
const executeMultipleQueries = async (fname, queries = []) => {
    console.log('in executeMultipleQueries and quries received from ' + fname);

    let connection = null;
    try {
        connection = await pool.getConnection();
        const results = [];
        for (const query of queries) {
            const [rows] = await connection.execute(query.query, query.params || []);
            results.push(rows);

        }
        console.log(results);

        return results;
    } catch (error) {
        return formatDbError(error)
    } finally {
        connection && connection.release();
    }
};

/**********************************************
*name : executeMultipleQueries
*description : executes multiple queries 
* input : ('server', async (connection) => {await connection.execute(`INSERT INTO users_lst_t (user_name) VALUES(?)`,['Syam']); await connection.execute(`INSERT INTO audit_logs_t(activity) VALUES(?)`,['User Created']);});)
************************************************/
const executeTransaction = async (callback) => {
    console.log('in executeTransaction and quries received from ' + fname);

    let connection = null;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;

    } catch (error) {
        return formatDbError(error)
    } finally {
        connection && connection.release();
    }
};

/**********************************************
*name : executeTransactionQueries
*description : executes multiple queries in a transaction
* input : ('server', [{ query: 'insert into dymmy (dumy_name) values (?)', params: ['Shyam'] }, { query: 'insert into dymmy (dumy_name) values (?)', params: ['Prasad'] }])
************************************************/
const executeTransactionQueries = async (fname, queries = []) => {
    console.log('in executeTransactionQueries and quries received from ' + fname);

    let connection = null;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const results = [];
        for (const query of queries) {
            const [rows] = await connection.execute(query.query, query.params || []);
            results.push(rows);
        }
        await connection.commit();
        return results;
    } catch (error) {
        return formatDbError(error);
    } finally {
        connection && connection.release();
    }
};

module.exports = { executeQuery, executeTransaction, executeTransactionQueries, executeMultipleQueries, getConnection };