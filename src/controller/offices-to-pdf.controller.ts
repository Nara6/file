import fs from 'fs-extra';
import officeToPdf from 'office-to-pdf';
import dotenv from 'dotenv';
import { FilePayload, createFile } from "../services/files.service";
import { Request, Response } from 'express';
import { Project } from '../models/models';
import responseError from '../shared/error.response';
import responseSuccess from '../shared/success.response';
import deleteFile from '../shared/unlink.file';

dotenv.config();
const fileServeURL = process.env.FILE_SERVE_URL || '/file/serve';

const officesToPdfController = async function (req: Request, res: Response) {

    // Check files to make sure it is array
    if (!Array.isArray(req.files)) {
        return responseError(res, 400, 'Invalid request!');
    }
    const files: FilePayload[] = req.files;
    const project: Project = res.locals.project;
    let pdfFiles: FilePayload[] = [];

    // Reject the files if it not the office files (word, excel and power point)
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    for (let file of files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            for (let file of files) {
                deleteFile(file.path);
            }
            return responseError(res, 400, 'Invalid file type. Only Word, Excel, and PowerPoint documents are allowed.');
        }
    }

    for (let file of files) {
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
                encoding: 'office',
            };

            const uriFile: string = `${fileServeURL}/${file.filename}`;
            const uriPDF: string = `${fileServeURL}/${pdfFile.filename}`;

            // Handle the response for successful and failed cases of createFile
            try {
                await createFile(pdfFile, uriFile, project);
            } catch (error) {
                deleteFile(file.path);
                // Handle the error from createFile function here
                return responseError(res, 500, 'Failed to create file. Please try again later.');
            }
            try {
                await createFile(pdfFile, uriPDF, project);
            } catch (error) {
                deleteFile(pdfFile.path);
                // Handle the error from createFile function here
                return responseError(res, 500, 'Failed to create file. Please try again later.');
            }

            // If everything is fine, continue to push data to pdfFiles
            pdfFiles.push(pdfFile);

        } catch (error) {
            // Handle any unexpected errors here
            console.error('Error:', error);
            return responseError(res, 500, 'Something went wrong. Please try again later.');
        }
    }

    const dataFormat = {
        files: files.map((file: FilePayload) => {
            delete file.fieldname;
            delete file.path;
            delete file.destination;
            file['uri'] = `${fileServeURL}/${file.filename}`;
            return file;
        }),
        pdfFiles: pdfFiles.map((file: FilePayload) => {
            delete file.fieldname;
            delete file.path;
            delete file.destination;
            file['uri'] = `${fileServeURL}/${file.filename}`;
            return file;
        })
    }

    return responseSuccess(res, dataFormat, 'Files has been converted successfully!');
}

export default officesToPdfController;