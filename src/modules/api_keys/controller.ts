import { Request, Response } from 'express';
import { createToken, randomName } from '@airbotics-core/utils';
import { prisma } from '@airbotics-core/drivers';
import { IApiKey } from '@airbotics-types';
import { BadResponse, NotFoundResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';


/**
 * @description Create a new API key, can only be called from dashboard
 */
export const createKey = async (req: Request, res: Response) => {

    const {
        name,
        permissions
    } = req.body;

    const {
        plain,
        hint,
        hashed
    } = createToken('api_key');

    await prisma.apiKey.create({
        data: {
            name,
            hint,
            value: hashed,
            permissions,
            tenant_uuid: req.user!.tenant_uuid
        }
    });

    const response = {
        api_key: plain
    };

    logger.info('a user has created an api key');
    return new SuccessJsonResponse(res, response);

}




/**
 * @description List API keys, can only be called from dashboard
 */
export const listKeys = async (req: Request, res: Response) => {

    const apiKeys = await prisma.apiKey.findMany({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    const response: IApiKey[] = apiKeys.map(apiKey => ({
        uuid: apiKey.uuid,
        name: apiKey.name,
        hint: apiKey.hint,
        permissions: apiKey.permissions,
        created_at: apiKey.created_at,
    }));

    logger.info('a user has listed their api keys');
    return new SuccessJsonResponse(res, response);
}




/**
 * @description Delete an API key, can only be called from dashboard
 */
export const deleteKey = async (req: Request, res: Response) => {

    const apiKey = await prisma.apiKey.findUnique({
        where: {
            uuid: req.params.id
        }
    });

    if (!apiKey) {
        logger.warn('a user is trying to delete an api key that does not exist');
        return new NotFoundResponse(res, 'Cannot delete that API key.');
    }

    if (apiKey.tenant_uuid !== req.user!.tenant_uuid) {
        logger.warn('a user is trying to delete an api key that is not in their tenant');
        return new NotFoundResponse(res, 'Cannot delete that API key.');
    }

    await prisma.apiKey.delete({
        where: {
            uuid: req.params.id
        }
    });

    logger.info('a user has deleted an api key');
    return new SuccessMessageResponse(res, 'You have deleted that API key.');

}