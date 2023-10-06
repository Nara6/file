import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const DB_PORT       = process.env.DB_PORT;
const DB_HOST       = process.env.DB_HOST;
const DB_DATABASE   = process.env.DB_DATABASE;
const DB_USERNAME   = process.env.DB_USERNAME;
const DB_PASSWORD   = process.env.DB_PASSWORD;
const DATABASE_URL  = `mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;
const sequelize = new Sequelize(DATABASE_URL);

// const dbConnectString = `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${process.env.DB_HOST})(PORT=${process.env.DB_PORT}))(CONNECT_DATA=(SERVICE_NAME=${process.env.DB_TNS})))`;

// const sequelize = new Sequelize({
//     dialect: 'oracle',
//     host: process.env.DB_HOST || 'localhost',
//     dialectModulePath: 'oracledb',
//     username: process.env.DB_USERNAME || 'FILE_SERVICE',
//     password: process.env.DB_PASSWORD || 'CamCyber',
//     database: process.env.DB_DATABASE || 'FILE_SERVICE',
//     logging: false, // Turn off SQL execution logging
//     dialectOptions: {
//         connectString: dbConnectString,
//     }
// });

export default sequelize;