import dotenv from 'dotenv';
import { FilePayload, createFile } from '../services/files.service';
import { Request, Response } from 'express';
import { Project } from '../models/models';
import responseSuccess from '../shared/success.response';
import responseError from '../shared/error.response';

dotenv.config();

const fileServeURL = process.env.FILE_SERVE_URL || '/file/serve';

const updateFileController = async (req: Request, res: Response) => {
    try {
        const file: FilePayload = req.file;
        const uri: string = `${fileServeURL}/${file.filename}`;
        const project: Project = res.locals.project;

        const data = await createFile(file, uri, project);

        const dataFormat = {
            filename: data.filename,
            originalname: data.originalname,
            mimetype: data.mimetype,
            size: data.size,
            encoding: data.encoding,
            uri: data.uri
        };

        return responseSuccess(res, dataFormat, 'File has been uploaded successfully!');
    } catch (err) {
        console.error('Error while updating file:', err);
        return responseError(res, 500, 'An error occurred while uploading the file.');
    }
};

export default updateFileController;
