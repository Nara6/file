import { Request, Response, NextFunction } from "express";
import responseError from "../shared/error.response";
import { getProject } from "../services/files.service";

// Helper function to get the authorization token from the header
function getAuthToken(req: Request): string | undefined {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    
    return authHeader && authHeader.split(' ')[1];
}

// Middleware function to check the project authorization
async function projectAuthorization(req: Request, res: Response, next: NextFunction) {

    try {
        const secret = getAuthToken(req);

        if (!secret) {
            return responseError(res, 401, 'Authorization failed!. Secret must be provided');
        }

        const project = await getProject(secret);

        if (!(project && (project.secret === secret))) {
            return responseError(res, 401, 'Authorization failed!. Secret is invalid');
        }
        
        // if(!(project && (project.auth_ip === req.ip))){
        //     return responseError(res, 401, 'Authorization failed!. IP is invalid');
        // }

        res.locals.project = project;
        next();
    } catch (error) {
        return responseError(res, 401, 'Authorization failed!. Invalid request');
    }

}

export default projectAuthorization;