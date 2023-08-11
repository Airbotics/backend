import { config } from '@airbotics-core/config';
import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { PassportUser } from '@airbotics-types';
import { BadResponse, SuccessMessageResponse, UnauthenticatedResponse, UnauthorisedResponse } from '@airbotics-core/responses';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { logger } from '@airbotics-core/logger';


/**
 * @description Authguard for protected routes.
 * 
 * At this stage app.use(passport.session()) middleware will have already 
 * set req.user if it detected a valid session cookie in the request.
 * 
 * If not we must check if the request is being authorised with an API token
 * If this fails we can infer the request is not authenticated.
 */
export const mustBeAuthenticated = (req: Request, res: Response, next: NextFunction) => {

    if (config.AUTH_ENABLED === false) {
        req.user = {
            tenant_uuid: '11111111-1111-1111-1111-111111111111',
            permissions: Object.values(Permissions)
        }
        next();
    }

    else {

        // request was not authenticated with a session cookie
        if (req.user === undefined) {

            // check if the request is authenticated with token
            passport.authenticate('token', (err: any, user: PassportUser | boolean) => {
                if (err) return next(err);
                if (user === false) return new UnauthenticatedResponse(res);
                req.user = user as PassportUser;
                next();
            })(req, res, next);

        }

        // request is authenticated with a session cookie
        else {
            next();
        }
    }

}


/**
 * @description Authguard for routes requiring user not be authenticated.
 * 
 */
export const mustNotBeAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    
    if (config.AUTH_ENABLED === false) {
        next()
    }
    else {
        if (req.user === undefined) {
            next();
        }
        else {
            logger.warn('an authenticated actor is trying to access a resource that requires them to not be authenticated');
            return new BadResponse(res, 'authentication_error', 'You are already authenticated.');
        }
    }
}


/**
 * @description Authorization guard
 */
export const mustBeAuthorised = (required_permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        
        if (config.AUTH_ENABLED === false){
            next();
        }

        else {
            if(req.user!.permissions.includes(required_permission)) {
                next();
            }
            else {
                logger.warn('an actor is trying to access a resource they do not have permissions to');
                return new UnauthorisedResponse(res);
            }
        }
    }
}


/**
 * @description Validation middleware
 * 
 * This returns an express middleware that will validate part of the request against a schema.
 */
export const validate = (schema: Joi.ObjectSchema, source: EValidationSource) =>
    (req: Request, res: Response, next: NextFunction): BadResponse | void => {

        try {

            const { error } = schema.validate(req[source], { abortEarly: true });

            if (!error) {
                return next();
            }

            const errorMessages: string[] = error.details.map((i: any) => i.message.replace(/['"]+/g, ''));

            logger.warn(`validation error - ${errorMessages.toString()}`);
            return new BadResponse(res, 'validation_error', errorMessages.toString());

        } catch (error) {
            // something unknown happened, throw the error and let the global
            // error hander pick it up
            next(error);
        }

    };