import multer from 'multer'
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { formatDateData } from '../../utils/datetime.utils';
import { Request, Response, NextFunction } from 'express';
import responseError from '../shared/error.response';
import deleteFile from '../shared/unlink.file';
import { Project } from '../models/models';
const fileDir = process.env.FILE_DIR || './public/';

const multerStorage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        // Do not process the destination logic here
        callback(null, fileDir);
    },
    filename: (_req, _file, callback) => {
        callback(null, uuidv4());
    }
});

// Middleware to handle the file upload
const voiceUpload = multer({
    storage: multerStorage,
    limits: {
        fileSize: 200 * 1024 * 1024, // allowed 200mb only (size of file)
        files: 1, // Only file can upload
    }
}).single('voice');

// Middleware to handle form data fields, including req.body.key and req.body.folder
const formDataMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Execute the multer single file upload middleware
    voiceUpload(req, res, async (error: multer.MulterError | any) => {

        if (!req.file) {
            return responseError(res, 400, 'No voice uploaded! Please upload a voice.');
        }
        
        if (error instanceof multer.MulterError) {
            // Handle Multer errors
            if (error.code === 'LIMIT_FILE_SIZE') {
                return responseError(res, 400, 'Voice size limit exceeded!');
            } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return responseError(res, 400, 'Field voice is required!');
            } else if (error.code === 'LIMIT_FILE_COUNT') {
                return responseError(res, 400, 'Only one voice allowed! Please upload only one voice.');
            }
        } else if (error) {
            // Handle other errors
            return responseError(res, 400, error.message);
        }

        // Now the req.body should have the parsed fields, including req.body.key
        // Validate the request
        const validationError = validateRequest(req, res);
        if (validationError) {
            deleteFile(req.file.path);
            return responseError(res, 400, validationError);
        }

        // Process destination logic based on req.body.key and req.body.folder
        let date = formatDateData(new Date());
        let mainFolder: string = req.body.key.replace(/[^\w]/gi, '');
        if (mainFolder) mainFolder = mainFolder.toLowerCase();
        let subFolder: string = req.body.folder.replace(/[^\w]/gi, '');
        if (subFolder) subFolder = subFolder.toLowerCase();
        const path = `${fileDir}${mainFolder}/${subFolder}/${date}/`;
        // Create the destination folder if it doesn't exist
        await fs.ensureDir(path);
        const sourceFilePath: string = `${req.file.path}`;
        const targetFilePath: string = `${path}${req.file.filename}`;
        try {
            await renameFile(sourceFilePath, targetFilePath);
        } catch (err) {
            // Handle the error if the file move fails
            console.error('Error during voice move:', err);
            return responseError(res, 500, 'Error while saving the voice.');
        }

        req.file.path = targetFilePath; // Store the file path in req.file
        req.file.destination = path;    // Store the destination path in req.file

        // If everything is fine, continue to the next middleware
        next();
    });
};

async function renameFile(sourceFilePath: string, targetFilePath: string) {
    try {
        await fs.rename(sourceFilePath, targetFilePath);
        console.log('Voice moved successfully.');
    } catch (err) {
        console.error('Error moving voice:', err);
        throw new Error('Error while saving the voice.');
    }
}

const validateRequest = (req: Request, res: Response) => {
    const project: Project = res.locals.project;
    if (!(req.body.key || req.body.folder)) {
        return 'Fields key and folder are required!';
    } else if (!req.body.folder) {
        return 'Field folder is required!';
    } else if (!req.body.key) {
        return 'Field key is required!';
    }
    else if (project.key !== req.body.key) {
        return 'Field key is invalid!';
    }
    return null;
};

// Set up multer with configuration options for upload voice
const voiceMulter = (req: Request, res: Response, next: NextFunction) => {
    // Execute the formDataMiddleware to handle the file upload and other fields
    formDataMiddleware(req, res, () => {
        // Check if the voice field is present in the request
        // if (!req.file) {
        //     return responseError(res, 400, 'No voice uploaded! Please upload a voice.');
        // }

        // If everything is fine, continue to the next middleware
        next();
    });
};

export default voiceMulter;