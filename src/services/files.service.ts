import { File, Project } from "../models/models";
export interface FilePayload {
    fieldname: string
    filename: string;
    originalname: string;
    mimetype: string;
    destination: string,
    path: string;
    size: number;
    encoding: string;
}

export const createFile = async (file: FilePayload, uri: string, project: Project): Promise<File> => {
    try {
        const newFile = await File.create({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            uri: uri,
            path: file.path,
            size: file.size,
            encoding: file.encoding,
            projectId: project.id
        });

        return newFile;
    } catch (error) {
        console.error(error.message);
        throw error; // Re-throw the error to be caught in the calling function
    }
};


export const getFile = async (filename: string): Promise<File | null> => {
    try {
        const file = await File.findOne({
            where: {
                filename: filename
            }
        });
        if (!file) return null;
        return file;
    } catch (error) {
        console.log(error.message);
        throw error; // Re-throw the error to be caught in the calling function
    }
};

export const getProject = async (secret: string): Promise<Project | null> => {
    try {
        const project = await Project.findOne({
            where: {
                secret: secret
            }
        });
        if (!project) return null;
        return project;
    } catch (error) {
        throw error; // Re-throw the error to be caught in the calling function
    }
}
