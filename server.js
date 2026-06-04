require('dotenv').config();

const server = require('./node');
const dbutils = require('./utilities/db.utils');
const dbconfig = require('./db.config');

const port = process.env.PORT || 4901;

async function execute() {

    try {
        const res = await dbutils.executeQuery('server', 'SELECT * FROM dymmy where id = ?', [17]);
        const res1 = await dbutils.executeMultipleQueries('server', [{ query: 'SELECT * FROM dymmy where id = ?', params: [17] }, { query: 'SELECT * FROM dymmy where id = ?', params: [18] }]);
        const res2 = await dbutils.executeTransactionQueries('server', [{ query: 'insert into dymmy (id, dumy_name) values (?,?)', params: [17,'Shyam'] }, { query: 'insert into dymmy (dumy_name) values (?)', params: ['Prasad'] }]);


        console.log('My first query:', res);
        console.log('My first multiple queries:', res1);
        console.log('My first transaction queries:', res2);

    } catch (error) {
        console.error(error);
    }
}
execute();


server.app.listen(port, 'localhost', () => {
    console.log(`Server listening on ${port}`);
}
);