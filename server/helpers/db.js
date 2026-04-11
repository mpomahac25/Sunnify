require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    });

const query = async (sql, values = []) => {
    const result = await pool.query(sql, values);
    return result;
    return new Promise(async (resolve, reject) => {
        try {
            
            resolve(result);
        } catch (error) {
            reject(error.message);
        }
    });
}

module.exports = { query };

