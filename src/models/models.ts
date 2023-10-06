import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config';

// Define a model project
export class Project extends Model {
    public id: number;
    public key: string;
    public secret: string;
    public auth_ip: string
    public created_at: Date;
    public updated_at: Date;
}
Project.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    secret: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    auth_ip: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at' // Specify your own name for createdAt column
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at' // Specify your own name for updateAt column
    }
}, {
    sequelize,
    modelName: 'project',
    tableName: 'project', // Set the table name to 'project' 
    timestamps: false
});

// Define a model
export class File extends Model {
    public id: number;
    public filename: string;
    public originalname: string | null;
    public mimetype: string;
    public uri: string;
    public path: string;
    public size: string;
    public encoding: string;
    public project_id: number;
    public created_at: Date;
    public updated_at: Date;
}

File.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    originalname: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    mimetype: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    uri: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    path: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    size: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    encoding: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    projectId: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: Project,
            key: 'id'
        },
        field: 'project_id'
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at' // Specify your own name for createdAt column
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at' // Specify your own name for updateAt column
    }
}, { sequelize, modelName: 'files', timestamps: false });

Project.hasMany(File, { onDelete: 'CASCADE' });
File.belongsTo(Project);