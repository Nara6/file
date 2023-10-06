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

const officeToPdfController = async function (req: Request, res: Response) {

    const file: FilePayload = req.file;
    const project: Project = res.locals.project;

    // Reject the files if it not the office files (word, excel and power point)
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        deleteFile(file.path);
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
        const pdfFile = {
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

         // If everything is fine, continue to return data to the client
        const dataFormat = {
            file: {
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                encoding: file.encoding,
                uri: uriFile
            },
            pdfFile: {
                filename: pdfFile.filename,
                originalname: pdfFile.originalname,
                mimetype: pdfFile.mimetype,
                size: pdfFile.size,
                encoding: pdfFile.encoding,
                uri: uriPDF
            }
        }

        return responseSuccess(res, dataFormat, 'File has been converted successfully!');

    } catch (error) {
        // Handle any unexpected errors here
        console.error('Error:', error);
        return responseError(res, 500, 'Something went wrong. Please try again later.');
    }
}

export default officeToPdfController;