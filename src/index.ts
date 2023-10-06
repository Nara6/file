import express, { Application } from 'express';
import dotenv from 'dotenv';
import sequelize from './config/database.config';
import cors from 'cors';
import router from './routes/router';
import bodyParser from 'body-parser';
import { errorHandlerMiddleware } from './middleware/handling.middleware';

dotenv.config();
const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(cors());
app.use(router);

// Register the error handling middleware (should be the last middleware)
app.use(errorHandlerMiddleware);

async function main() {
    try {
        await sequelize.authenticate();
        app.listen(PORT, () => {
            console.log('Connection has been established successfully.');
            console.log('Node API running on port:', PORT);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}
main();