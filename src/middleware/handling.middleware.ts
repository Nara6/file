import { Request, Response, NextFunction } from 'express';

export const errorHandlerMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error); // Log the error for debugging purposes
    const status = res.statusCode === 200 ? 500 : res.statusCode; // Use 500 as the default status if none is set
    const message = error.message || 'Internal Server Error';
    res.status(status).json({ error: message });
};
