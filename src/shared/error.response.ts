import { Response } from "express";

const responseError = (res: Response, code: number, message: string) => {
    return res.status(code).json({
        statusCode: code,
        message: message
    });
}

export default responseError;