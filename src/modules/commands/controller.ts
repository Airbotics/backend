import { Request, Response } from 'express';
import { prisma } from '@airbotics-core/drivers';
import { client } from '@airbotics-core/mqtt';
import { ICommand } from '@airbotics-types';
import { CommandState } from '@prisma/client';
import { config } from '@airbotics-core/config';
import { BadResponse, NotFoundResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';
import { formatMqttTopic } from '@airbotics-core/utils';
import { CloudToRobotTopics, DEFAULT_SKIP, DEFAULT_TAKE } from '@airbotics-core/consts';


/**
 * @description Send a command to a robot.
 */
export const sendCommand = async (req: Request, res: Response) => {

    const {
        interface: command_interface,
        name,
        type,
        payload
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
        logger.warn('a user is trying to send a command to a robot that does not exist in their tenant');
        return new NotFoundResponse(res, 'Cannot find robot to send command to.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying to send a command to a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot send a command to a robot that is not provisioned.');
    }

    const command = await prisma.command.create({
        data: {
            robot_uuid: robot.uuid,
            state: CommandState.created,
            interface: command_interface,
            name,
            type,
            payload,
            tenant_uuid: req.user!.tenant_uuid
        }
    });


    if (robot.online) {

        const mqttPayload = JSON.stringify({
            uuid: command.uuid,
            interface: command_interface,
            name,
            type,
            payload,
        });

        const mqttTopic = formatMqttTopic(req.user!.tenant_uuid, req.params.id, CloudToRobotTopics.CommandsSend);
        client.publish(mqttTopic, mqttPayload, { qos: 0 });

        await prisma.command.update({
            where: {
                uuid: command.uuid
            },
            data: {
                state: CommandState.sent
            }
        });

        const response = {
            uuid: command.uuid
        };
        logger.info('a user has sent a command to a robot');
        return new SuccessJsonResponse(res, response);

    } else {

        await prisma.command.update({
            where: {
                uuid: command.uuid
            },
            data: {
                state: CommandState.error,
                error_code: 'robot_not_online'
            }
        });

        logger.warn('a user is trying to send a command to a robot that is not online');
        return new BadResponse(res, 'robot_not_online', 'That robot is not online.');

    }

}


/**
 * @description List all commands sent to all robots.
 */
export const listCommands = async (req: Request, res: Response) => {

    const skip = Number(req.query.offset) || DEFAULT_SKIP;
    const take = Number(req.query.limit) || DEFAULT_TAKE;

    const commands = await prisma.command.findMany({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        },
        orderBy: {
            created_at: 'desc'
        },
        include: {
            robot: {
                select: { id: true }
            }
        },
        skip: skip,
        take: take
    });

    const response: ICommand[] = commands.map(command => ({
        uuid: command.uuid,
        robot_id: command.robot.id,
        state: command.state,
        error_code: command.error_code,
        interface: command.interface,
        name: command.name,
        type: command.type,
        payload: command.payload as object,
        created_at: command.created_at
    }));

    logger.info('a user has listed their robots');
    return new SuccessJsonResponse(res, response);
}


/**
 * @description Get details about a single command
 */
export const getCommandDetail = async (req: Request, res: Response) => {

    const command = await prisma.command.findUnique({
        where: {
            uuid: req.params.id
        },
        include: {
            robot: {
                select: { id: true }
            }
        }
    });

    if (!command) {
        logger.warn('a user has tried to get details for a command that does not exist');
        return new NotFoundResponse(res, 'Cannot get that command.');
    }

    if (command.tenant_uuid !== req.user!.tenant_uuid) {
        logger.warn('a user has tried to get details for a command that is not in their tenant');
        return new NotFoundResponse(res, 'Cannot get that command.');
    }

    const response: ICommand = {
        uuid: command.uuid,
        robot_id: command.robot.id,
        state: command.state,
        error_code: command.error_code,
        interface: command.interface,
        name: command.name,
        type: command.type,
        payload: command.payload as object,
        created_at: command.created_at
    };

    logger.info('a user has gotten details of a command');
    return new SuccessJsonResponse(res, response);
}


/**
 * @description Delete a command
 */
export const deleteCommand = async (req: Request, res: Response) => {

    const command = await prisma.command.findUnique({
        where: {
            uuid: req.params.id
        }
    });

    if (!command) {
        logger.warn('a user is trying to delete command that does not exist');
        return new NotFoundResponse(res, 'Cannot delete that command.');
    }

    if (command.tenant_uuid !== req.user!.tenant_uuid) {
        logger.warn('a user is trying to delete  a command that is not in their tenant');
        return new NotFoundResponse(res, 'Cannot delete that command.');
    }

    await prisma.command.delete({
        where: {
            uuid: req.params.id
        }
    });

    logger.info('a user has deleted a command');
    return new SuccessMessageResponse(res, 'You have deleted that command.');
}


/**
 * @description List all commands sent to given robot.
 */
export const listRobotCommands = async (req: Request, res: Response) => {

    const skip = Number(req.query.offset) || DEFAULT_SKIP;
    const take = Number(req.query.limit) || DEFAULT_TAKE;

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });
    if (!robot) {
        logger.warn('a user is trying to list commands sent to a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot list commands.');
    }

    const commands = await prisma.command.findMany({
        where: {
            robot_uuid: robot.uuid,
            tenant_uuid: req.user!.tenant_uuid
        },
        orderBy: {
            created_at: 'desc'
        },
        skip: skip,
        take: take
    });
    
    const response = commands.map(command => ({
        uuid: command.uuid,
        state: command.state,
        error_code: command.error_code,
        interface: command.interface,
        name: command.name,
        type: command.type,
        payload: command.payload,
        created_at: command.created_at
    }));

    logger.info('a user has listed commands sent to a robot');
    return new SuccessJsonResponse(res, response);
}
