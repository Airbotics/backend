import { Request, Response } from 'express';
import { prisma } from '@airbotics-core/drivers';
import { client } from '@airbotics-core/mqtt';
import { IStream } from '@airbotics-types';
import { BadResponse, NotFoundResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';
import { formatMqttTopic } from '@airbotics-core/utils';
import { CloudToRobotTopics, DEFAULT_DATA_TAKE, DEFAULT_SKIP, DEFAULT_TAKE } from '@airbotics-core/consts';
import { robotId } from '@airbotics-core/schemas';


/**
 * create a stream
 * 
 */
export const createStream = async (req: Request, res: Response) => {

    const {
        source,
        type,
        hz
    } = req.body;

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            streams: {
                where: {
                    source: source
                }
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to create a stream for a robot that does not exist in their tenant');
        return new NotFoundResponse(res, 'Cannot find robot to create stream for.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying to create a stream for a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot create a stream for a robot that is not provisioned.');
    }

    if (robot.streams.length !== 0) {
        logger.warn('a user is trying to create a stream for a robot that already exists');
        return new BadResponse(res, 'stream_already_exists', 'Cannot create a stream that already exists for a robot');
    }

    const stream = await prisma.stream.create({
        data: {
            hz: hz,
            robot_uuid: robot.uuid,
            source: source,
            type: type,
            enabled: true,
            tenant_uuid: req.user!.tenant_uuid
        }
    });

    const streams = await prisma.stream.findMany({
        where: {
            robot_uuid: robot.uuid,
            enabled: true
        }
    });

    const mqttTopic = formatMqttTopic(req.user!.tenant_uuid, robot.id, CloudToRobotTopics.DataConfig);

    const mqttPayload = JSON.stringify(
        streams.map(stream => ({
            uuid: stream.uuid,
            source: stream.source,
            hz: stream.hz,
            type: stream.type,
            enabled: stream.enabled
        }))
    )

    client.publish(mqttTopic, mqttPayload, { qos: 0 });

    logger.info('a user has created a data collection stream for a robot');
    return new SuccessMessageResponse(res, 'You have created a data collection stream for that robot.');
}




/**
 * list streams on a robot
 */
export const listStreams = async (req: Request, res: Response) => {

    const robotStreams = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            streams: true
        }
    })

    if (robotStreams === null) {
        logger.warn('a user is trying to list streams for a robot that does not exist in their tenant');
        return new NotFoundResponse(res, 'Cannot find robot to list streams for.');
    }

    const response: IStream[] = robotStreams.streams.map(stream => ({
        uuid: stream.uuid,
        source: stream.source,
        source_encoded: stream.source.replace(/\//g, '%2F'),
        type: stream.type,
        hz: stream.hz,
        enabled: stream.enabled,
        first_recording: stream.first_recording,
        last_recording: stream.last_recording,
        num_recordings: stream.num_recordings,
        created_at: stream.created_at
    }));

    logger.info('a user has listed all data streams for a robot');
    return new SuccessJsonResponse(res, response);

}




/**
 * update streams for a robot
 */
export const updateStream = async (req: Request, res: Response) => {

    const {
        enabled,
        hz
    } = req.body;


    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            streams: {
                select: { uuid: true },
                where: {
                    source: req.params.source
                }
            }
        }
    })

    if (robot === null) {
        logger.warn('a user is trying to update a stream for a robot that does not exist in their tenant');
        return new NotFoundResponse(res, 'Cannot find stream to update.');
    }

    if (robot.streams.length === 0) {
        logger.warn('a user is trying to update a stream that does not exist for a robot in their tenant');
        return new NotFoundResponse(res, 'Cannot find stream to update.');
    }


    const updatedStream = await prisma.stream.update({
        where: {
            uuid: robot.streams[0].uuid
        },
        data: {
            ...(enabled !== undefined && { enabled: enabled }),
            ...(hz !== undefined && { hz: hz }),
        }
    });

    const streams = await prisma.stream.findMany({
        where: {
            robot_uuid: robot.uuid,
            enabled: true
        }
    });

    const mqttTopic = formatMqttTopic(req.user!.tenant_uuid, robot.id, CloudToRobotTopics.DataConfig);

    const mqttPayload = JSON.stringify(
        streams.map(stream => ({
            uuid: stream.uuid,
            source: stream.source,
            hz: stream.hz,
            type: stream.type,
            enabled: stream.enabled
        }))
    )

    client.publish(mqttTopic, mqttPayload, { qos: 0 });

    logger.info('a user has updated a data collection stream for a robot');
    return new SuccessMessageResponse(res, 'You have updated a data collection stream for that robot.');

}




/**
 * delete stream for a robot
 * 
 */
export const deleteStream = async (req: Request, res: Response) => {

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            streams: {
                select: { uuid: true },
                where: {
                    source: req.params.source
                }
            }
        }
    });

    if (robot === null) {
        logger.warn('a user is trying to delete a stream for a robot that does not exist in their tenant');
        return new NotFoundResponse(res, 'Cannot find stream to delete.');
    }

    if (robot.streams.length === 0) {
        logger.warn('a user is trying to delete a stream that does not exist for a robot in their tenant');
        return new NotFoundResponse(res, 'Cannot find stream to delete.');
    }

    // delete stream which will cascade to delete data points
    await prisma.stream.delete({
        where: {
            uuid: robot.streams[0].uuid
        }
    });

    const streams = await prisma.stream.findMany({
        where: {
            robot_uuid: robot.uuid,
            enabled: true
        }
    });

    const mqttTopic = formatMqttTopic(req.user!.tenant_uuid, robot.id, CloudToRobotTopics.DataConfig);

    const mqttPayload = JSON.stringify(
        streams.map(stream => ({
            uuid: stream.uuid,
            source: stream.source,
            hz: stream.hz,
            type: stream.type,
            enabled: stream.enabled
        }))
    )

    client.publish(mqttTopic, mqttPayload, { qos: 0 });

    logger.info('a user has deleted data stream for a robot');
    return new SuccessMessageResponse(res, 'You have deleted the data stream from that robot.');
}




/**
 * get data for a robot
 */
export const getData = async (req: Request, res: Response) => {

    const queryParams = {
        source: req.query.source as string,
        latest_only: req.query.latest_only ? JSON.parse(req.query.latest_only as string) : false,
        from: req.query.from ? new Date(req.query.from as string) : undefined,
        to: req.query.to ? new Date(req.query.to as string) : undefined,
        limit: req.query.latest_only ? 1 : Number(req.query.limit) || DEFAULT_DATA_TAKE,
        offset: Number(req.query.offset) || DEFAULT_SKIP
    }

    const robot = await prisma.robot.findUnique({
        where: {
            id_tenant_uuid: {
                id: req.params.id,
                tenant_uuid: req.user!.tenant_uuid
            }
        },
        include: {
            streams: {
                where: {
                    source: queryParams.source
                }
            }
        }
    });

    if (!robot) {
        logger.warn('a user is trying to get data for a robot that does not exist in their tenant');
        return new NotFoundResponse(res, 'Cannot find robot to get data.');
    }

    if (!robot.provisioned) {
        logger.warn('a user is trying to get data for a robot that is not provisioned');
        return new NotFoundResponse(res, 'Cannot get data for a robot that is not provisioned.');
    }

    if (robot.streams.length === 0) {
        logger.warn('a user is trying to get data from a stream that does not exist');
        return new NotFoundResponse(res, 'Cannot find stream to get data from.');
    }

    const dataPoints = await prisma.dataPoint.findMany({
        where: {
            robot_uuid: robot.uuid,
            stream_uuid: robot.streams[0].uuid,
            sent_at: {
                ...(queryParams.from && { gt: queryParams.from }),
                ...(queryParams.to && { lt: queryParams.to })
            }
        },
        skip: queryParams.offset,
        take: queryParams.limit,
        orderBy: {
            sent_at: 'desc'
        }
    })

    const sanitisedDataPoints = dataPoints.map(dataPoint => ({
        uuid: dataPoint.uuid,
        sent_at: dataPoint.sent_at,
        payload: dataPoint.payload
    }));


    logger.info('a user has queried data from a robot');
    return new SuccessJsonResponse(res, sanitisedDataPoints);
}