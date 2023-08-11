import { Request, Response } from 'express';
import { prisma } from '@airbotics-core/drivers';
import { client } from '@airbotics-core/mqtt';
import { ICommand, ILog, ILogsConfig } from '@airbotics-types';
import { CommandState } from '@prisma/client';
import { config } from '@airbotics-core/config';
import { BadResponse, NotFoundResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';
import { CloudToRobotTopics, DEFAULT_SKIP, DEFAULT_TAKE } from '@airbotics-core/consts';
import { formatMqttTopic } from '@airbotics-core/utils';


/**
 * Turn on or off logs collection
 */
export const configureLogs = async (req: Request, res: Response) => {

    const {
        enabled
    } = req.body

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to configure logs for a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot find robot to confgure logs.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying to configure logs for a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot configure logs for a robot that is not provisioned.');
    }

    await prisma.robot.update({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        data: {
            logs_enabled: enabled
        }
    }); 


    // send mqtt command
    const mqttTopic = formatMqttTopic(req.user!.tenant_uuid, req.params.id, CloudToRobotTopics.LogsConfig);
    const mqttPayload = JSON.stringify({
        enabled
    });
    client.publish(mqttTopic, mqttPayload, { qos: 0 });

    logger.info('a user has configured logs for a robot');
    return new SuccessMessageResponse(res, 'You have configured logs for that robot.');
    
}


/**
 * Get configuration for logs collection
 */
export const getLogsConfiguration= async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to get logs configuration for a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot find robot to confgure logs.');
    }


    const response: ILogsConfig = {
        enabled: robot.logs_enabled,
        first_recording: robot.logs_first_recording,
        last_recording: robot.logs_last_recording,
        num_recordings: robot.logs_num_recordings
    };

    logger.info('a user has gotten configuration of logs for a robot');
    return new SuccessJsonResponse(res, response);

}


/**
 * Get logs for a robot
 */
export const getLogs = async (req: Request, res: Response) => {

    const skip = Number(req.query.offset) || DEFAULT_SKIP;
    const take = Number(req.query.limit) || DEFAULT_TAKE;
    
    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            logs: {
                orderBy: {
                    stamp: 'desc'
                },
                skip,
                take
            }
        }
    });


    if (!robot) {
        logger.warn('a user is trying to get logs for a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot get logs for that robot.');
    }


    const response: ILog[] = robot.logs.map(log => ({
        uuid: log.uuid,
        stamp: log.stamp,
        level: log.level,
        name: log.name,
        file: log.file,
        function: log.function,
        line: log.line,
        msg: log.msg
    }))

    logger.info('a user has listed all logs for a robot')
    return new SuccessJsonResponse(res, response);
    
}


/**
 * Delete logs for a robot
 */
export const deleteLogs = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to delete logs for a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot delete logs for that robot.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying to delete logs for a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot delete logs for a robot that is not provisioned.');
    }


    await prisma.log.deleteMany({
        where: {
            robot_uuid: robot.uuid
        }
    });

    await prisma.robot.update({
        where: { uuid: robot.uuid },
        data: {
            logs_num_recordings: 0,
            logs_last_recording: null,
            logs_first_recording: null
        }
    })

    logger.info('a user has deleted all logs for a robot')
    return new SuccessMessageResponse(res, 'You have deleted all logs for that robot.');

}