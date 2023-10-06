import dotenv from 'dotenv';
import { FilePayload, createFile } from '../services/files.service';
import { Project } from '../models/models';
import { Request, Response } from 'express';
import responseError from '../shared/error.response';
import responseSuccess from '../shared/success.response';

dotenv.config();

const fileServeURL = process.env.FILE_SERVE_URL || '/file/serve';

interface UploadedFilePayload extends FilePayload {
    uri: string;
}

const uploadFilesController = async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.files)) {
            return responseError(res, 400, 'Invalid request!');
        }

        const project: Project = res.locals.project;
        const uploadedFiles: UploadedFilePayload[] = [];

        for (let file of req.files) {
            try {
                const uri: string = `${fileServeURL}/${file.filename}`;
                await createFile(file, uri, project);
                uploadedFiles.push({
                    ...file,
                    uri: `${fileServeURL}/${file.filename}`,
                    fieldname: undefined,
                    path: undefined,
                    destination: undefined
                });
            } catch (err) {
                console.error('Error while creating file:', err);
                return responseError(res, 500, 'An error occurred while uploading the files.');
            }
        }

        return responseSuccess(res, uploadedFiles, 'Files have been uploaded successfully!');
    } catch (err) {
        console.error('Error:', err);
        return responseError(res, 500, 'An error occurred while processing the request.');
    }
};

export default uploadFilesController;
