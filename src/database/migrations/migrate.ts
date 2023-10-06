import sequelize from "../../config/database.config";
import { File, Project } from "../../models/models";

async function migrate() {
    try {
        await sequelize.authenticate();
        // This will drop and recreate tables
        await Project.sync({ force: true });
        await File.sync({ force: true });
        console.log('=============================================');
        console.log('Migrations has been established successfully.');
        console.log('=============================================');
    } catch (error) {
        console.error('Unable to migrate the database:', error);
        process.exit(1);
    }
}

migrate();