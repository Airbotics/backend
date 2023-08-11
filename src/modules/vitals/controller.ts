import { Request, Response } from 'express';
import { prisma } from '@airbotics-core/drivers';
import { IVital } from '@airbotics-types';
import {  NotFoundResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';
import { DEFAULT_SKIP, DEFAULT_TAKE } from '@airbotics-core/consts';


/**
 * Get vitals for a robot
 */
export const getRobotVitals = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            vitals: {
                orderBy: {
                    created_at: 'desc'
                },
                skip: Number(req.query.offset) || DEFAULT_SKIP,
                take: req.query.latest_only ? 1: Number(req.query.limit) || DEFAULT_TAKE
            }
        }
    })

    if (!robot) {
        logger.warn('a user is trying to get logs for a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot get logs for that robot.');
    }

    const response: IVital[] = robot.vitals.map(vital => ({
        uuid: vital.uuid,
        created_at: vital.created_at,
        battery: vital.battery,
        cpu: vital.cpu,
        ram: vital.ram,
        disk: vital.disk,
    }))

    logger.info('a user has listed all logs for a robot')
    return new SuccessJsonResponse(res, response);
    
}


/**
 * Delete vitals for a robot
 */
export const deleteRobotLogs = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to delete vitals for a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot delete vitals for that robot.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying to delete vitals for a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot delete vitals for a robot that is not provisioned.');
    }

    await prisma.vital.deleteMany({
        where: {
            robot_uuid: robot.uuid
        }
    })

    logger.info('a user has deleted all vitals for a robot')
    return new SuccessMessageResponse(res, 'You have deleted all vitals for that robot.');

}