import { Request, Response } from 'express';
import { prisma } from '@airbotics-core/drivers';
import { client } from '@airbotics-core/mqtt';
import { ICommand, IRobotComposeFile } from '@airbotics-types';
import { CommandState, RobotComposeFileState } from '@prisma/client';
import { IComposeFile } from '@airbotics-types';
import { config } from '@airbotics-core/config';
import { BadResponse, NotFoundResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';
import { formatMqttTopic } from '@airbotics-core/utils';
import { CloudToRobotTopics } from '@airbotics-core/consts';


/**
 * create a compose file
 */
export const createComposeFile = async (req: Request, res: Response) => {

    const {
        id,
        name,
        content
    } = req.body;

    const existingCompose = await prisma.composeFile.findUnique({
        where: {
            id_tenant_uuid: {
                id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (existingCompose) {
        logger.warn('a user is trying to add a compose file with an existing id');
        return new BadResponse(res, 'compose_file_already_exists', 'A compose file with that id already exists.');
    }

    const compose = await prisma.composeFile.create({
        data: {
            id,
            name,
            content,
            tenant_uuid: req.user!.tenant_uuid
        }
    });

    logger.info('a user has created a compose file');
    return new SuccessJsonResponse(res, { 
        id: compose.id
     });

};


/**
 * lists compose files
 */
export const listComposeFiles = async (req: Request, res: Response) => {

    const composes = await prisma.composeFile.findMany({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        },
        orderBy: {
            created_at: 'desc'
        }
    });


    const response: IComposeFile[] = composes.map(compose => ({
        id: compose.id,
        name: compose.name,
        content: compose.content as object,
        created_at: compose.created_at,
    }));

    logger.info('a user has listed their compose files');
    return new SuccessJsonResponse(res, response);


};


/**
 * gets details
 */
export const getComposeFile = async (req: Request, res: Response) => {

    const compose = await prisma.composeFile.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!compose) {
        logger.warn('a user has tried to get details for a compose file that does not exist');
        return new NotFoundResponse(res, 'Cannot get that compose file.');
    }

    if (compose.tenant_uuid !== req.user!.tenant_uuid) {
        logger.warn('a user has tried to get details for a compose file that is not in their tenant');
        return new NotFoundResponse(res, 'Cannot get that compose file.');
    }

    const response: IComposeFile = {
        id: compose.id,
        name: compose.name,
        content: compose.content as object,
        created_at: compose.created_at,
    };

    logger.info('a user has gotten details about a compose file');
    return new SuccessJsonResponse(res, response);

};


/**
 * Delete a compose file
 */
export const deleteComposeFile = async (req: Request, res: Response) => {

    const composeFile = await prisma.composeFile.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            robots: true
        }
    });

    if (!composeFile) {
        logger.warn('a user is trying to delete compose file that does not exist');
        return new NotFoundResponse(res, 'Cannot delete that compose file.');
    }

    if (composeFile.tenant_uuid !== req.user!.tenant_uuid) {
        logger.warn('a user is trying to delete a compose file that is not in their tenant');
        return new NotFoundResponse(res, 'Cannot delete that compose file.');
    }

    
    if(composeFile.robots.length > 0) {
        // not safe to delete unless all of the assigned robots are in 'down' state
        if(composeFile.robots.every(bot => bot.state === 'down') === false) {
            logger.warn('a user is trying to delete a compose file that is deployed to a robot.');
            return new BadResponse(res, 'compose_file_on_robots', 'Cannot delete a compose file that is on a robot.');
        }
    }

    await prisma.composeFile.delete({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    logger.info('a user has deleted a compose file');
    return new SuccessMessageResponse(res, 'You have deleted that compose file.');

};


/**
 * Put a compose file on a robot
 */
export const putComposeOnRobot = async (req: Request, res: Response) => {

    const {
        id: composeFileId
    } = req.body;
 
    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to put a compose file on a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot put that compose file on that robot.');
    }

    if (robot.tenant_uuid !== req.user!.tenant_uuid) {
        logger.warn('a user is trying to put a compose file on a robot that is not in their tenant');
        return new NotFoundResponse(res, 'Cannot put that compose file on that robot.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying to put a compose file on a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot put a compose file on a robot that is not provisioned.');
    }

    // check new compose file exists
    const newComposeFile = await prisma.composeFile.findUnique({
        where: {
            id_tenant_uuid: {
                id: composeFileId,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!newComposeFile) {
        logger.warn('a user has tried to put a compose file on a robot but the file does not exist');
        return new NotFoundResponse(res, 'Cannot put that compose file on that robot.');
    }

    if (newComposeFile.tenant_uuid !== req.user!.tenant_uuid) {
        logger.warn('a user has tried to put a compose file on a robot but the file is not in their tenant');
        return new NotFoundResponse(res, 'Cannot put that compose file on that robot.');
    }


    await prisma.robotComposeFile.upsert({
        create: {
            tenant_uuid: req.user!.tenant_uuid,
            robot_uuid: robot.uuid,
            compose_file_uuid: newComposeFile.uuid,
            state: RobotComposeFileState.pending_up
        },
        update: {
            compose_file_uuid: newComposeFile.uuid,
            created_at: new Date(),
            state: RobotComposeFileState.pending_up
        },
        where: {
            tenant_uuid_robot_uuid: {
                tenant_uuid: req.user!.tenant_uuid,
                robot_uuid: robot.uuid
            }
        }
    });


    const mqttTopic = formatMqttTopic(req.user!.tenant_uuid, req.params.id, CloudToRobotTopics.ContainersConfig);
    const mqttPayload = JSON.stringify({
        uuid: robot.uuid,
        compose: newComposeFile.content
    });
    client.publish(mqttTopic, mqttPayload, { qos: 0 });

    logger.info('a user has put a compose file on a robot');
    return new SuccessMessageResponse(res, 'You have put that compose file on that robot.');

};


/**
 * Get which compose file is on a robot
 * 
 * TODO 
 * - return any state in the robotComposeFile entity
 */
export const getComposeOnRobot = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to get which compose file is on a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot get the compose file on that robot.');
    }

    const robotComposeFile = await prisma.robotComposeFile.findUnique({
        where: {
            tenant_uuid_robot_uuid: {
                tenant_uuid: req.user!.tenant_uuid,
                robot_uuid: robot.uuid
            }
        },
        include: {
            compose_file: true
        }
    });

    if (!robotComposeFile) {
        logger.info('a user has gotten containers is currently on a robot, but none are on it');
        // return new NotFoundResponse(res, 'The robot does not have a compose file on it.');
        // TODO this should be a NotFound response
        return new SuccessJsonResponse(res, {});
    }

    const response: IRobotComposeFile = {
        id: robotComposeFile.compose_file.id,
        name: robotComposeFile.compose_file.name,
        state: robotComposeFile.state,
        error_code: robotComposeFile.error_code,
        content: robotComposeFile.compose_file.content as object,
        created_at: robotComposeFile.compose_file.created_at,
    };

    logger.info('a user has gotten which compose file is currently on a robot');
    return new SuccessJsonResponse(res, response);

};


/**
 * Remove a compose file from a robot
 */
export const removeComposefromRobot = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to remove a compose file from a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot remove the compose file from that robot.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying remove a compose file from a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot remove a compose file from a robot that is not provisioned.');
    }

    const robotComposeFile = await prisma.robotComposeFile.findUnique({
        where: {
            tenant_uuid_robot_uuid: {
                tenant_uuid: req.user!.tenant_uuid,
                robot_uuid: robot.uuid
            }
        },
        include: {
            compose_file: true
        }
    });

    if (!robotComposeFile) {
        logger.warn('a user is trying to remove a compose file from a robot that does not have a compose file on it');
        return new BadResponse(res, 'error', 'No compose file is on this robot.');
    }

    await prisma.robotComposeFile.update({
        where: {
            tenant_uuid_robot_uuid: {
                tenant_uuid: req.user!.tenant_uuid,
                robot_uuid: robot.uuid
            }
        },
        data: {
            state: RobotComposeFileState.pending_down
        }
    });

    const mqttPayload = JSON.stringify({
        uuid: robot.uuid,
        compose: null
    });

    const mqttTopic = formatMqttTopic(req.user!.tenant_uuid, req.params.id, CloudToRobotTopics.ContainersConfig);
    client.publish(mqttTopic, mqttPayload, { qos: 0 });

    logger.info('a user has removed a compose file from a robot');
    return new SuccessMessageResponse(res, 'You have removed the compose file from that robot.');

};



