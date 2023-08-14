import { CommandState, LogLevel, RobotComposeFileState } from '@prisma/client';
import { prisma } from '@airbotics-core/drivers';
import { IMqttMessage } from '@airbotics-types';
import { logger } from '@airbotics-core/logger';
import { client } from '@airbotics-core/mqtt';
import { CloudToRobotTopics } from '@airbotics-core/consts';
import { formatMqttTopic } from '@airbotics-core/utils';

/**
 * TODO only send init if presence is true
 */
export const handlePresence = async (message: IMqttMessage) => {

    logger.info(`a robot with agent ${message.payload.agent_version} has updated its presence to be: ${message.payload.online}`)

    const robot = await prisma.robot.update({
        where: {
            uuid: message.robot.uuid
        },
        data: {
            provisioned: true,
            online: message.payload.online,
            online_updated_at: new Date(), // Note: we must take server time for this
            agent_version: message.payload.agent_version
        },
        include: {
            streams: {
                where: { enabled: true }
            }
        }
    });

    // if the robot is coming online, send init messages
    if (message.payload.online) {

        // Check if there is a compose file in a pending state
        const pendingRobotCompose = await prisma.robotComposeFile.findFirst({
            where: {
                OR: [
                    { state: 'pending_up' },
                    { state: 'pending_down' },
                ],
                AND: [
                    { tenant_uuid: message.tenant_uuid },
                    { robot_uuid: message.robot.uuid },
                ]
            },
            include: {
                compose_file: true,
            }
        });

        if (pendingRobotCompose) {
            // send init data compose message
            const composeTopic = formatMqttTopic(message.tenant_uuid, message.robot.id, CloudToRobotTopics.ContainersConfig);
            const composePayload = JSON.stringify({
                uuid: message.robot.uuid,
                compose: pendingRobotCompose.state === 'pending_up' ? pendingRobotCompose.compose_file.content : null
            });
            client.publish(composeTopic, composePayload, { qos: 0 });
        }

        // send init logging
        const logTopic = formatMqttTopic(message.tenant_uuid, message.robot.id, CloudToRobotTopics.LogsConfig);
        const logPayload = JSON.stringify({
            enabled: robot.logs_enabled
        });
        client.publish(logTopic, logPayload, { qos: 0 });


        // send init data collection message
        const dataTopic = formatMqttTopic(message.tenant_uuid, message.robot.id, CloudToRobotTopics.DataConfig);
        const dataPayload = JSON.stringify(
            robot.streams.map(stream => ({
                source: stream.source,
                hz: stream.hz,
                type: stream.type,
                enabled: stream.enabled
            }))
        );
        client.publish(dataTopic, dataPayload, { qos: 0 });

        // send init vitals collection message
        const vitalsTopic = formatMqttTopic(message.tenant_uuid, message.robot.id, CloudToRobotTopics.VitalsConfig);
        const vitalsPayload = JSON.stringify({
            enabled: robot.vitals_enabled
        });
        client.publish(vitalsTopic, vitalsPayload, { qos: 0 });
        
    }

}


export const handleCmdConfirm = async (message: IMqttMessage) => {
    logger.info(`a robot has confirmed a command with a state: ${message.payload.success} and error_code: ${message.payload.error_code}`);

    const command = await prisma.command.findUnique({
        where: {
            uuid: message.payload.uuid
        },
    });

    if (!command) {
        logger.error('a command confirmation message was received for a command that does not exist');
        return;
    }

    if (command.tenant_uuid !== message.tenant_uuid) {
        logger.error('a command confirmation message was received for a command that is not in the right tenant');
        return;
    }

    await prisma.command.update({
        where: {
            uuid: message.payload.uuid
        },
        data: {
            state: message.payload.success ? CommandState.executed : CommandState.error,
            error_code: message.payload.error_code
        }
    });

}


export const handleContainerConfirm = async (message: IMqttMessage) => {
    logger.info(`a robot has confirmed containers with a state: ${message.payload.state} and error_code: ${message.payload.error_code}`);

    const robotComposeFile = await prisma.robotComposeFile.findUnique({
        where: {
            tenant_uuid_robot_uuid: {
                robot_uuid: message.payload.uuid,
                tenant_uuid: message.tenant_uuid
            }
        }
    })

    if (!robotComposeFile) {
        logger.error('a containers confirmation message was received for a robot compose file that does not exist');
        return;
    }

    if (robotComposeFile.tenant_uuid !== message.tenant_uuid) {
        logger.error('a comtainer update confirmation message was received for a robot compose file that is not in the right tenant');
        return;
    }

    await prisma.robotComposeFile.update({
        where: {
            tenant_uuid_robot_uuid: {
                robot_uuid: message.payload.uuid,
                tenant_uuid: message.tenant_uuid
            }
        },
        data: {
            state: message.payload.state,
            error_code: message.payload.error_code
        }
    });

}


export const handleLogsIngest = async (message: IMqttMessage) => {
    logger.info(`a robot has sent a log message`);

    await prisma.$transaction([
        prisma.robot.update({ 
            where: { uuid: message.robot.uuid },
            data: {
                logs_last_recording: message.payload.stamp,
                logs_num_recordings: { increment: 1 }
            }
        }),
        prisma.log.create({
            data: {
                file: message.payload.file,
                function: message.payload.function,
                line: message.payload.line,
                level: message.payload.level,
                msg: message.payload.msg,
                name: message.payload.name,
                stamp: message.payload.stamp,
                tenant_uuid: message.tenant_uuid,
                robot_uuid: message.robot.uuid
            }
        })
    ])
}


export const handleVitalsIngest = async (message: IMqttMessage) => {

    logger.info(`a robot has sent a vitals message`);

    try {
        await prisma.vital.create({
            data: {
                battery: message.payload.battery,
                cpu: message.payload.cpu,
                ram: message.payload.ram,
                disk: message.payload.disk,
                robot_uuid: message.robot.uuid,
                tenant_uuid: message.tenant_uuid
            }
        })

    } catch (e) {
        console.log(e)
        logger.error('could not create robot vitals');
    }

}


export const handleDataIngest = async (message: IMqttMessage) => {
    logger.info(`a robot has sent a data message`);

    const stream = await prisma.stream.findUnique({
        select: { uuid: true, enabled: true, first_recording: true },
        where: {
            robot_uuid_source: {
                robot_uuid: message.robot.uuid,
                source: message.payload.source
            }
        }
    });

    if (!stream) {
        logger.error('a robot is trying to upload data for a stream that does not exist');
        return;
    }

    if (!stream.enabled) {
        logger.error('a robot is trying to upload data for a stream that is disabled');
        return;
    }

    await prisma.$transaction([
        prisma.dataPoint.create({
            data: {
                payload: message.payload.payload,
                sent_at: message.payload.sent_at,
                robot_uuid: message.robot.uuid,
                tenant_uuid: message.tenant_uuid,
                stream_uuid: stream.uuid
            }
        }),
        prisma.stream.update({
            where: {
                uuid: stream.uuid
            },
            data: {
                ...(stream.first_recording === null && { first_recording: message.payload.sent_at }),
                last_recording: message.payload.sent_at,
                num_recordings: {
                    increment: 1
                }
            }
        })    
    ])
}