import sequelize from "../../config/database.config";
import { Project, File } from "../../models/models";

const projects = [
    {
        key: 'PMS',
        secret: btoa('mpwt:test'),
        auth_ip: '::1'
    },
    {
        key: 'DMS',
        secret: btoa('mpwt:q1w2e3'),
        auth_ip: '::1'
    }
];

const files = [
    {
        filename: 'file1.jpg',
        originalname: 'file1.jpg',
        mimetype: 'image/jpeg',
        path: '/path/to/file1.jpg',
        uri: 'file/serve/dce9f357-503d-4c6f-bf3f-6b4eb0423406',
        size: '12345',
        encoding: 'base64',
        projectId: 1,
    },
    {
        filename: 'file2.jpg',
        originalname: 'file2.jpg',
        mimetype: 'image/jpeg',
        path: '/path/to/file2.jpg',
        uri: 'file/serve/dce9f357-503d-4c6f-bf3f-6b4eb0423406',
        size: '67890',
        encoding: 'base64',
        projectId: 2,
    },
];

async function seeds() {
    try {
        await sequelize.authenticate();

        // This will drop and recreate tables
        await sequelize.sync({ force: true });

        // Seed the data into the tables
        await Project.bulkCreate(projects);
        await File.bulkCreate(files);
        console.log('===========================================');
        console.log('Data seeded into the database successfully.');
        console.log('===========================================');
    } catch (error) {
        console.error('Error seeding data into the database:', error);
    }
}

async function tableExists(tableName: string): Promise<boolean> {
    const [results] = await sequelize.query(
        `SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}' LIMIT 1;`
    );
    return results.length > 0;
}

seeds();