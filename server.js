const server = require('./node');
require('dotenv').config();
console.log(process.env);
const port = process.env.port || 4901;



server.app.listen(port,'localhost', () => {
    console.log(`Server is up and listening at http://localhost:${port} to the requests... `);
})