const dbconfig = require('../config/db.config');
const dberrors = require('./db-errors')
const pool = dbconfig.pool;
dbconfig.logPoolEvents(pool);

const getConnection = async (dbPool = pool) => {
    return await dbPool.getConnection();
};

// converts a raw mysql error into a typed 'DatabaseError' carrying the friendly message
const formatDbError = (error) => {
    console.error('Database Error:', error);
    const dbError = dberrors.getDatabaseError(error.code);
    const formattedError = new Error(dbError.message);
    formattedError.name = 'DatabaseError';
    formattedError.code = error.code;
    return formattedError;
}
/**********************************************
*name : executeQuery
*description : executes multiple queries
* input : ('SELECT * FROM dymmy where id = ?', [2], 'server', operatorPool) - pool is optional, defaults to admin pool
************************************************/
const executeQuery = async (query, params = [], fname, dbPool = pool) => {
    console.log('in executeQuery and quries received from ' + fname);

    try {
        const [rows] = await dbPool.execute(query, params);
        return rows;
    } catch (error) {
        throw formatDbError(error);
    } finally {
        console.log('Execution completed!');
    }
};

/**********************************************
*name : executeMultipleQueries
*description : executes multiple queries
* input : ('server', [{ query: 'SELECT * FROM dymmy where id = ?', params: [2] }, { query: 'SELECT * FROM dymmy where id = ?', params: [1] }])
************************************************/
const executeMultipleQueries = async (queries = [], fname, dbPool = pool) => {
    console.log('in executeMultipleQueries and quries received from ' + fname);

    let connection = null;
    try {
        connection = await dbPool.getConnection();
        const results = [];
        for (const query of queries) {
            const [rows] = await connection.execute(query.query, query.params || []);
            results.push(rows);

        }
        console.log(results);

        return results;
    } catch (error) {
        throw formatDbError(error);
    } finally {
        connection && connection.release();
    }
};

/**********************************************
*name : executeTransaction
*description : executes multiple queries
* input : ('server', async (connection) => {await connection.execute(`INSERT INTO users_lst_t (user_name) VALUES(?)`,['Syam']); await connection.execute(`INSERT INTO audit_logs_t(activity) VALUES(?)`,['User Created']);});)
************************************************/
const executeTransaction = async (callback, fname, dbPool = pool) => {
    console.log('in executeTransaction and quries received from ' + fname);

    let connection = null;

    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;

    } catch (error) {
        connection && await connection.rollback();
        throw formatDbError(error);
    } finally {
        connection && connection.release();
    }
};

/**********************************************
*name : executeTransactionQueries
*description : executes multiple queries in a transaction
* input : ('server', [{ query: 'insert into dymmy (dumy_name) values (?)', params: ['Shyam'] }, { query: 'insert into dymmy (dumy_name) values (?)', params: ['Prasad'] }])
************************************************/
const executeTransactionQueries = async (queries = [], fname, dbPool = pool) => {
    console.log('in executeTransactionQueries and quries received from ' + fname);

    let connection = null;

    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        const results = [];
        for (const query of queries) {
            const [rows] = await connection.execute(query.query, query.params || []);
            results.push(rows);
        }
        await connection.commit();
        return results;
    } catch (error) {
        connection && await connection.rollback();
        throw formatDbError(error);
    } finally {
        connection && connection.release();
    }
};

module.exports = { executeQuery, executeTransaction, executeTransactionQueries, executeMultipleQueries, getConnection };
