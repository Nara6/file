import fs from 'fs-extra';
import dotenv from 'dotenv';
import { FilePayload, createFile } from "../services/files.service";
import { Poppler } from "node-poppler";
import { Project } from '../models/models';
import { Request, Response } from 'express';
import deleteFile from '../shared/unlink.file';
import responseError from '../shared/error.response';
import responseSuccess from '../shared/success.response';

dotenv.config();
const fileServeURL = process.env.FILE_SERVE_URL || '/file/serve';
const publicPath = process.env.FILE_DIR || './public/';

const pdfsToImageController = async function (req: Request, res: Response) {
    try {

        if (!Array.isArray(req.files)) {
            return responseError(res, 400, 'Invalid request!');
        }

        const files: FilePayload[] = req.files;
        const project: Project = res.locals.project;
        const picFiles: FilePayload[] = [];

        // Reject the files if it include other files that isn't the pdf files
        for (let file of files) {
            if (file.mimetype !== 'application/pdf') {
                for (let file of files) {
                    await deleteFile(file.path);
                }
                return responseError(res, 400, 'All files must be the pdf files');
            }
        }

        for (const file of files) {
            try {
                const pathPdf = file.path;
                // const poppler = new Poppler();
                // for docker
                const poppler = new Poppler('/usr/bin');
                const options = {
                    pngFile: true,
                    singleFile: true
                };
                const outputFile: string = publicPath + '/output';
                const response: string | Error = await poppler.pdfToCairo(pathPdf, outputFile, options);

                if (response !== 'No Error') {
                    throw new Error('Error while converting the file');
                }

                const filePath: string = publicPath + '/output.png';

                try {
                    const size = (await fs.promises.stat(filePath)).size;
                    const fileName = `${file.filename}-page1`;
                    const sourceFilePath = filePath;
                    const targetFilePath = `${file.path}-page1`;

                    await renameFile(sourceFilePath, targetFilePath);

                    const picFile: FilePayload = {
                        fieldname: 'files',
                        filename: `${fileName}`,
                        originalname: `${file.originalname}.jpeg`,
                        mimetype: 'image/jpeg',
                        destination: file.destination,
                        path: targetFilePath,
                        size: size,
                        encoding: 'pdf'
                    };

                    const uriFile: string = `${fileServeURL}/${file.filename}`;
                    await createFile(file, uriFile, project);

                    const uriPic: string = `${fileServeURL}/${picFile.filename}`;
                    await createFile(picFile, uriPic, project);

                    picFiles.push(picFile);
                } catch (err) {
                    console.error('Error during file move:', err);
                    throw new Error('Error while saving the file.');
                }
            } catch (err) {
                console.error('Error converting PDF:', err);
                for (let file of files) {
                    await deleteFile(file.path);
                }
                return responseError(res, 400, err.message ? err.message : 'Error during PDF conversion');
            }
        }

        const dataFormat = {
            files: files.map((file: FilePayload) => ({
                ...file,
                uri: `${fileServeURL}/${file.filename}`,
                fieldname: undefined,
                path: undefined,
                destination: undefined
            })),
            picFiles: picFiles.map((file: FilePayload) => ({
                ...file,
                uri: `${fileServeURL}/${file.filename}`,
                fieldname: undefined,
                path: undefined,
                destination: undefined
            }))
        };

        return responseSuccess(res, dataFormat, 'Files have been converted successfully!');
    } catch (err) {
        console.error('General error:', err);
        return responseError(res, 500, err.message ? err.message : 'Internal server error');
    }
}

const renameFile = async (sourceFilePath: string, targetFilePath: string) => {
    try {
        await fs.rename(sourceFilePath, targetFilePath);
        console.log('File moved successfully.');
    } catch (err) {
        console.error('Error moving file:', err);
        throw new Error('Error while saving the file.');
    }
}

export default pdfsToImageController;