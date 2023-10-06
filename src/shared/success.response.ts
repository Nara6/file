import { Response } from "express";

const responseSuccess = (res: Response, data: any, message: string) => {
    return res.status(200).json({
        statusCode: 200,
        data: data,
        message: message
    });
}

export default responseSuccess;