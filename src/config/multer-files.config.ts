import multer from 'multer'
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { formatDateData } from '../../utils/datetime.utils';
import { Request, Response, NextFunction } from 'express';
import responseError from '../shared/error.response';
import deleteFile from '../shared/unlink.file';
import { Project } from '../models/models';
const fileDir = process.env.FILE_DIR || './public/';

const multerStorage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, fileDir);
    },
    filename: (_req, _file, callback) => {
        callback(null, uuidv4());
    }
});

// Middleware to handle the files upload
const multipleFilesUpload = multer({
    storage: multerStorage,
    limits: {
        fileSize: 200 * 1024 * 1024, // allowed 100mb only (size of file)
        files: 5, // Maximum number of files allowed (e.g., 5 files)
    }
}).array('files');

// Middleware to handle form data fields, including req.body.key and req.body.folder
const formDataMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Execute the multer multiple files upload middleware
    multipleFilesUpload(req, res, async (error: multer.MulterError | any) => {

        if (error instanceof multer.MulterError) {
            // Handle Multer errors
            if (error.code === 'LIMIT_FILE_SIZE') {
                return responseError(res, 400, 'File size limit exceeded!');
            } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return responseError(res, 400, 'Field files is required!');
            } else if (error.code === 'LIMIT_FILE_COUNT') {
                return responseError(res, 400, 'Only 5 files allowed! Please select less than or equal to 5 files.');
            }
        } else if (error) {
            // Handle other errors
            return responseError(res, 400, error.message);
        }


        // Now the req.body should have the parsed fields, including req.body.key
        // Validate the request
        const validationError = validateRequest(req, res);
        if (validationError) {
            if (Array.isArray(req.files)) {
                for (let file of req.files) {
                    deleteFile(file.path);
                }
            }
            else {
                return responseError(res, 400, 'Invalid request!');
            }
            return responseError(res, 400, validationError);
        }

        // Process destination logic based on req.body.key and req.body.folder
        const date = formatDateData(new Date());
        let mainFolder: string = req.body.key.replace(/[^\w]/gi, '');
        if (mainFolder) mainFolder = mainFolder.toLowerCase();
        let subFolder: string = req.body.folder.replace(/[^\w]/gi, '');
        if (subFolder) subFolder = subFolder.toLowerCase();
        const destinationFolder = `${fileDir}${mainFolder}/${subFolder}/${date}/`;
        try {
            // Create the destination folder if it doesn't exist
            await fs.ensureDir(destinationFolder);

            // Get a list of files in the source folder (fileDir)
            const files = await fs.readdir(fileDir);

            // Loop through each file and move it to the destination folder
            for (const file of files) {
                const sourceFilePath = path.join(fileDir, file);
                const destinationFilePath = path.join(destinationFolder, file);

                const stat = await fs.stat(sourceFilePath);
                
                // Check if it's a file (not a folder) before moving
                if (stat.isFile()) {
                    await fs.move(sourceFilePath, destinationFilePath);
                }
            }
        } catch (err) {
            console.error('Error moving files:', err);
        }

        if (Array.isArray(req.files)) {
            req.files = req.files.map(file => {
                file.path = `${destinationFolder}${file.filename}`;
                file.destination = destinationFolder;
                return file;
            });
        }
        else {
            return responseError(res, 400, 'Invalid request!');
        }

        // If everything is fine, continue to the next middleware
        next();
    });
};

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

// Set up multer with configuration options for single file
const multipleFilesMulter = (req: Request, res: Response, next: NextFunction) => {
    // Execute the formDataMiddleware to handle the file upload and other fields
    formDataMiddleware(req, res, () => {
        
        // Check if the file field is present in the request
        if (req.files && req.files.length === 0) {
            return responseError(res, 400, 'No file uploaded! Please select a file.');
        }

        // If everything is fine, continue to the next middleware
        next();
    });
};

export default multipleFilesMulter;