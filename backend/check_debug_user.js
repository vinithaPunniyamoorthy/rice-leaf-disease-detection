const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [rows] = await connection.execute('SELECT * FROM User WHERE UserName = ?', ['Debug User']);
    console.log('User Found:', rows.length > 0);
    if (rows.length > 0) {
        console.log('User Data:', rows[0]);
    }
    await connection.end();
}

checkDb().catch(console.error);
