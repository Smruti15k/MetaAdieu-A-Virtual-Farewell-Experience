import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'metaadieu';
const dbUser = process.env.DB_USER || 'root';
const dbHost = process.env.DB_HOST || 'localhost';
const dbDriver = process.env.DB_DRIVER || 'mysql';
const dbPassword = process.env.DB_PASSWORD;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: dbDriver as any,
    storage: dbDriver === 'sqlite' ? './database.sqlite' : undefined,
    logging: false,
});

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to the database has been established successfully.');
        await sequelize.sync(); // Be careful with sync in production!
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

export default sequelize;
