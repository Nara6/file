import express from 'express';
import projectAuthorization from '../middleware/authorization.middleware';
import singleFileMulter from '../config/multer-file.config';
import multipleFilesMulter from '../config/multer-files.config'
import readFileController from '../controller/read-file.controller';
import updateFileController from '../controller/upload-file.controller';
import uploadFilesController from '../controller/upload-files.controller';
import officeToPdfController from '../controller/office-to-pdf.controller';
import officesToPdfController from '../controller/offices-to-pdf.controller';
import pdfToImageController from '../controller/pdf-to-Image.controller';
import pdfsToImageController from '../controller/pdfs-to-image.controller';
import officeToPdfToImageController from '../controller/office-to-pdf-to-image.controller';
import uploadVoiceController from '../controller/upload-voice.controller';
import voiceMulter from '../config/multer-voice.config';

const router = express.Router();

/**============================
 * @noted read file by filename
 */
router.get("/file/serve/:filename",         readFileController);

/**=======================================
 * @noted sigle file upload with form-data
 */
router.post("/file/upload-single",          projectAuthorization, singleFileMulter,     updateFileController);

/**===========================================
 * @noted multiple files upload with form-data
 */
router.post("/file/upload-mutiple",         projectAuthorization,   multipleFilesMulter,  uploadFilesController);

/**==================================
 * @noted voice upload with form-data
 */
router.post("/file/upload-voice",           projectAuthorization,   voiceMulter,          uploadVoiceController);

/**=================================================================================
 *  @noted convert single file (word, excel and power point) to pdf with form-data
 */
router.post("/file/office-to-pdf",         projectAuthorization,    singleFileMulter,      officeToPdfController);

/**==================================================================================
 *  @noted convert multiple files (word, excel and power point) to pdf with form-data
 */
router.post("/file/offices-to-pdf",         projectAuthorization,   multipleFilesMulter,  officesToPdfController);

/**================================================================
 * @noted convert single file of pdf to image (first page of pdf)
 */
router.post("/file/pdf-to-image",          projectAuthorization,    singleFileMulter,      pdfToImageController);

/**================================================================
 * @noted convert multiple files of pdf to image (first page of pdf)
 */
router.post("/file/pdfs-to-image",          projectAuthorization,   multipleFilesMulter,  pdfsToImageController);

/**================================================================================================
 * @noted convert one file of (word or excel or power point) to pdf and to image (first page of pdf)
 */
router.post("/file/office-to-pdf-image",    projectAuthorization,   singleFileMulter,     officeToPdfToImageController);

export default router;