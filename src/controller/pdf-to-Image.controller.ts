import fs from 'fs-extra';
import dotenv from 'dotenv';
import { Poppler } from "node-poppler";
import { FilePayload, createFile } from '../services/files.service';
import { Request, Response } from 'express';
import responseError from '../shared/error.response';
import { Project } from '../models/models';
import responseSuccess from '../shared/success.response';
import deleteFile from '../shared/unlink.file';

dotenv.config();
const fileServeURL = process.env.FILE_SERVE_URL || 'file/serve';
const publicPath = process.env.FILE_DIR || './public/';

const pdfToImageController = async (req: Request, res: Response) => {
    const file: FilePayload = req.file;
    const project: Project = res.locals.project;
    if (file.mimetype !== 'application/pdf') {
        deleteFile(file.path);
        return responseError(res, 400, 'File must be the pdf file!.');
    }

    // for window
    // const poppler = new Poppler();
    // for docker
    const poppler = new Poppler('/usr/bin');    
    const options = {
        pngFile: true,
        singleFile: true //Writes only the first page and does not add digits
    };
    const outputFile: string = publicPath + '/output';
    const responnse: string | Error = await poppler.pdfToCairo(file.path, outputFile, options);
    if (responnse !== 'No Error') return responseError(res, 400, 'Error while convert the file');

    const filePath: string = publicPath + '/output.png';
    fs.stat(filePath, async (err, stats) => {
        if (err) {
            console.error(err);
            return responseError(res, 400, 'Error while convert the file');
        }
        let size = stats.size;
        let fileName = `${file.filename}-page1`;
        const sourceFilePath = filePath;
        const targetFilePath = `${file.path}-page1`;
        try {
            await renameFile(sourceFilePath, targetFilePath);
            const picFile: FilePayload = {
                fieldname: 'files',
                filename: `${fileName}`,
                originalname: `${file.originalname}.jpeg`,
                mimetype: 'image/jpeg',
                destination: file.destination,
                path: targetFilePath,
                size: size,
                encoding: 'pdf',
            };
            const uriFile: string = `${fileServeURL}/${file.filename}`;
            await createFile(file, uriFile, project);
            const uriPic: string = `${fileServeURL}/${picFile.filename}`;
            await createFile(picFile, uriPic, project);

            const dataFormat = {
                file: {
                    originalname: file.originalname,
                    encoding: file.encoding,
                    mimetype: file.mimetype,
                    filename: file.filename,
                    size: file.size,
                    uri: uriFile
                },
                picFile: {
                    originalname: picFile.originalname,
                    encoding: picFile.encoding,
                    mimetype: picFile.mimetype,
                    filename: picFile.filename,
                    size: picFile.size,
                    uri: uriPic
                }
            }
            return responseSuccess(res, dataFormat, 'File has been converted successfully.');
        } catch (err) {
            console.error('Error during file move:', err);
            return responseError(res, 500, 'Error while saving the file.');
        }
    });
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

export default pdfToImageController;