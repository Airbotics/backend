import axios, { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { createToken, randomName } from '@airbotics-core/utils';
import { prisma } from '@airbotics-core/drivers';
import { IRobot, IRobotCreated } from '@airbotics-types';
import { config } from '@airbotics-core/config';
import { BadResponse, NotFoundResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';


/**
 * 
 * @description Create a robot.
 * 
 * 1) Creates a new robot in the database
 * 2) Create a new username/password for the robot with the broker
 * 3) Create a new acl rule for the robot with the broker
 */
export const createRobot = async (req: Request, res: Response) => {

    const {
        id,
        name
    } = req.body;

    const {
        plain,
        hint,
        hashed
    } = createToken('robot');

    try {

        await prisma.$transaction(async (tx) => {

            // create the robot
            const robot = await tx.robot.create({
                data: {
                    id: id,
                    name: name || randomName(),
                    token_hint: hint,
                    token_value: hashed,
                    tenant_uuid: req.user!.tenant_uuid
                }
            });

            // Used by axios to authenticate with broker, axios auto base64 encodes these correctly and sets the header
            const axiosAuth = {
                username: config.MQTT_API_KEY!,
                password: config.MQTT_API_SECRET!
            };

            let mqttUserUrl;
            let mqttUserBody;
            let mqttRuleUrl;
            let mqttRuleBody;

            if(config.NODE_ENV === 'development') {
                mqttUserUrl = `${config.MQTT_ADMIN_HOST}/authentication/password_based:built_in_database/users`;
                mqttUserBody = { user_id: `${robot.tenant_uuid}-${robot.id}`, password: plain };
                mqttRuleUrl = `${config.MQTT_ADMIN_HOST}/authorization/sources/built_in_database/rules/users`;
                mqttRuleBody = [{
                    rules: [
                        {
                            action: 'all',
                            permission: 'allow',
                            topic: `${robot.tenant_uuid}/${robot.id}/#`,
                        }
                    ],
                    username: `${robot.tenant_uuid}-${robot.id}`
                }];
            }
            else {
                mqttUserUrl = `${config.MQTT_ADMIN_HOST}/auth_username`;
                mqttUserBody = { username: `${robot.tenant_uuid}-${robot.id}`, password: plain };
                mqttRuleUrl = `${config.MQTT_ADMIN_HOST}/acl`;
                mqttRuleBody = { 
                    username: `${robot.tenant_uuid}-${robot.id}`, 
                    topic: `${robot.tenant_uuid}/${robot.id}/#`,
                    action: 'pubsub',
                    access: 'allow'
                }
            }
            
            await axios.post(mqttUserUrl, mqttUserBody, { auth: axiosAuth });
            await axios.post(mqttRuleUrl, mqttRuleBody, { auth: axiosAuth });
               
        });

        const response: IRobotCreated = {
            robot_id: id,
            tenant_uuid: req.user!.tenant_uuid,
            token: plain
        };

        logger.info('a user has created a robot');
        return new SuccessJsonResponse(res, response);

    } catch (e) {
        if (e.code === 'P2002') {
            logger.warn('creating a robot failed due to ID constraint');
            return new BadResponse(res, 'robot_already_exists', 'A robot with that ID already exists');
        }
        logger.error(e.toJSON());
        return new BadResponse(res, 'mqtt_broker_error', 'The robot could not registered with the MQTT broker.');
    }
}




/**
 * 
 * @description List all robots
 */
export const listRobots = async (req: Request, res: Response) => {

    const robots = await prisma.robot.findMany({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        },
        orderBy: {
            created_at: 'desc'
        },
        include: {
            vitals: {
                take: 1,
                orderBy: { created_at: 'desc'}
            }
        }
    });

    const response: IRobot[] = robots.map(robot => ({
        id: robot.id,
        name: robot.name,
        provisioned: robot.provisioned,
        token_hint: robot.token_hint,
        agent_version: robot.agent_version,
        online: robot.online,
        online_updated_at: robot.online_updated_at,
        created_at: robot.created_at,
        vitals: robot.vitals.length === 0 ? null : {
            cpu: robot.vitals[0].cpu,
            battery: robot.vitals[0].battery,
            ram: robot.vitals[0].ram,
            disk: robot.vitals[0].disk,
        }
    }));

    logger.info('a user has listed their robots');
    return new SuccessJsonResponse(res, response);
}




/**
 * 
 * @description Get details about a single robot
 */
export const getRobotDetail = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            vitals: {
                take: 1,
                orderBy: { created_at: 'desc'}
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to get details of a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot get details about that robot.');
    }

    const response: IRobot = {
        id: robot.id,
        name: robot.name,
        provisioned: robot.provisioned,
        token_hint: robot.token_hint,
        agent_version: robot.agent_version,
        online: robot.online,
        online_updated_at: robot.online_updated_at,
        created_at: robot.created_at,
        vitals: robot.vitals.length === 0 ? null : {
            cpu: robot.vitals[0].cpu,
            battery: robot.vitals[0].battery,
            ram: robot.vitals[0].ram,
            disk: robot.vitals[0].disk,
        }
    };

    logger.info('a user has gotten details about one of their robots');
    return new SuccessJsonResponse(res, response);

}




/**
 * 
 * @description Delete a robot
 */
export const deleteRobot = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to delete a robot that does not exist');
        return new NotFoundResponse(res, 'Cannot delete that robot.');
    }

    try {

        await prisma.$transaction(async (tx) => {

            await tx.robot.delete({
                where: {
                    id_tenant_uuid: {
                        id: req.params.id,
                        tenant_uuid: req.user!.tenant_uuid
                    }
                }
            });

            const axiosAuth = {
                username: config.MQTT_API_KEY!,
                password: config.MQTT_API_SECRET!
            };

            let mqttUserUrl;
            let mqttRuleUrl;

            if(config.NODE_ENV === 'development') {
                mqttUserUrl = `${config.MQTT_ADMIN_HOST}/authentication/password_based:built_in_database/users/${robot.tenant_uuid}-${robot.id}`;
                mqttRuleUrl = `${config.MQTT_ADMIN_HOST}/authorization/sources/built_in_database/rules/users/${robot.tenant_uuid}-${robot.id}`;
            }

            else {
                mqttUserUrl = `${config.MQTT_ADMIN_HOST}/auth_username/${robot.tenant_uuid}-${robot.id}`
                mqttRuleUrl = `${config.MQTT_ADMIN_HOST}/acl/username/${robot.tenant_uuid}-${robot.id}/topic/${robot.tenant_uuid}%2F${robot.id}%2F%23`
            }
        
            await axios.delete(mqttUserUrl, { auth: axiosAuth });
            await axios.delete(mqttRuleUrl, { auth: axiosAuth });


        })

        logger.info('a user has deleted a robot');
        return new SuccessMessageResponse(res, 'You have deleted that robot.');

    } catch (e) {
        logger.error(e);
        return new BadResponse(res, 'unknown', 'Could not delete robot.');
    }


}



