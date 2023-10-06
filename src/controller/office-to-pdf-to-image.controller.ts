import { Request, Response } from 'express';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { Poppler } from "node-poppler";
import officeToPdf from 'office-to-pdf';
import { FilePayload, createFile } from '../services/files.service';
import { Project } from '../models/models';
import responseError from '../shared/error.response';
import responseSuccess from '../shared/success.response';

dotenv.config();
const fileServeURL = process.env.FILE_SERVE_URL || 'file/serve';
const publicPath = process.env.FILE_DIR || './public/';

export const officeToPdfToImageController = async function (req: Request, res: Response) {
    const file: FilePayload = req.file;
    const project: Project = res.locals.project;

    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return responseError(res, 400, 'Invalid file type. Only Word, Excel, and PowerPoint documents are allowed.');
    }

    /** @noted |=> use trycatch block to handle any unexpected errors. */
    try {

        // Check if the file exists and is accessible
        if (!fs.existsSync(file.path)) {
            return responseError(res, 400, 'File not found or inaccessible');
        }

        const buffer: Buffer = fs.readFileSync(file.path);
        const pdf: Buffer = await officeToPdf(buffer);

        fs.writeFileSync(`${file.destination}${file.filename}-pdf`, pdf);
        const size = Buffer.byteLength(pdf);
        const pdfFile: FilePayload = {
            fieldname: file.fieldname,
            filename: `${file.filename}-pdf`,
            originalname: `${file.originalname}.pdf`,
            mimetype: 'application/pdf',
            destination: file.destination,
            path: `${file.path}-pdf`,
            size: size,
            encoding: file.encoding,
        };

        /** it work for window ,if we run with docker: Poppoer('/usr/bin')*/
        // const poppler = new Poppler();
        const poppler = new Poppler('/usr/bin');
        const options = {
            pngFile: true,
            singleFile: true //Writes only the first page and does not add digits
        };
        const outputFile: string = publicPath + '/output';
        const filePath: string = publicPath + '/output.png';
        const responnse: string | Error = await poppler.pdfToCairo(pdfFile.path, outputFile, options);

        /** Check if we cannot conveted to image */
        if (responnse !== 'No Error') {
            console.log('Cannot convert');
            return responseError(res, 400, 'Error while convert the file');
        }

        fs.stat(filePath, async (err, stats) => {
            if (err) {
                console.error(err);
                return responseError(res, 400, 'Error while convert the file');
            }
            const size = stats.size;
            const fileName = `${pdfFile.filename}-page1`;
            const sourceFilePath = filePath;
            const targetFilePath = `${pdfFile.path}-page1`;
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
                const uriPdf: string = `${fileServeURL}/${pdfFile.filename}`;
                await createFile(pdfFile, uriPdf, project);
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
                    pdfFile: {
                        originalname: pdfFile.originalname,
                        encoding: pdfFile.encoding,
                        mimetype: pdfFile.mimetype,
                        filename: pdfFile.filename,
                        size: pdfFile.size,
                        uri: uriPdf
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
    } catch (error) {
        // Handle any unexpected errors here
        console.error('Error:', error);
        return responseError(res, 500, 'Something went wrong. Please try again later.');
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

export default officeToPdfToImageController;