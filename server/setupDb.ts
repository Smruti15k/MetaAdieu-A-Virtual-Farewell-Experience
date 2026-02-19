import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function createDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'metaadieu'}\`;`);
        console.log('Database created or already exists.');
        await connection.end();
    } catch (err) {
        console.error('Error creating database:', err);
    }
}

createDb();
