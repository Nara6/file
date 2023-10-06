import * as fileSystem from 'fs';
import { getFile } from '../services/files.service';
import responseError from '../shared/error.response';
import { Request, Response } from 'express';
import { File } from '../models/models';

const sendFileResponse = (res: Response, file: File, download: boolean) => {
    const headers = {
        'Content-Type': file.mimetype,
        'Content-Length': file.size
    };

    if (download) {
        headers['Content-disposition'] = `attachment; filename=${file.originalname}`;
    }

    res.writeHead(200, headers);

    const readStream = fileSystem.createReadStream(file.path);

    readStream.on('error', (err) => {
        return responseError(res, 400, err.message || 'Error while reading the file');
    });

    readStream.pipe(res);
};

const readFileController = async (req: Request, res: Response) => {
    const filename = req.params.filename;
    const download: boolean = req.query.download === 'true';

    try {
        const file = await getFile(filename);

        fileSystem.access(file.path, fileSystem.constants.F_OK, (err) => {
            if (err) {
                return responseError(res, 400, 'File not found!');
            }
            sendFileResponse(res, file, download);
        });
    } catch (err) {
        return responseError(res, 400, err.message || 'Path of file not found!');
    }
};

export default readFileController;