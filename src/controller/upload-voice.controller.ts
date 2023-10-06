import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { FilePayload, createFile } from '../services/files.service';
import { File, Project } from '../models/models';
import responseSuccess from '../shared/success.response';
import deleteFile from '../shared/unlink.file';
import responseError from '../shared/error.response';

dotenv.config();

const fileServeURL = process.env.FILE_SERVE_URL || '/file/serve';

const uploadVoiceController = async (req: Request, res: Response) => {
    try {
        const file: FilePayload = req.file;
        const uri: string = `${fileServeURL}/${file.filename}`;
        const project: Project = res.locals.project;

        if (file.mimetype && !file.mimetype.startsWith('audio/')) {
            await deleteFile(file.path);
            return responseError(res, 400, 'Invalid file type. Only audio files are allowed!');
        }

        const data: File = await createFile(file, uri, project);

        const dataFormat = {
            filename: data.filename,
            originalname: data.originalname,
            mimetype: data.mimetype,
            size: data.size,
            encoding: data.encoding,
            uri: data.uri
        };

        return responseSuccess(res, dataFormat, 'Voice has been uploaded successfully!');
    } catch (err) {
        console.error('Error:', err);
        return responseError(res, 500, 'An error occurred while processing the request.');
    }
};

export default uploadVoiceController;
