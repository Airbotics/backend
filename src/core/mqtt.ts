import mqtt from 'mqtt';
import { randomString } from './utils';
import { config } from '@airbotics-core/config';
import { prisma } from '@airbotics-core/drivers';
import { IMqttMessage, ISupportedTopic } from 'src/types';
import { handleCmdConfirm, handleContainerConfirm, handleDataIngest, handleLogsIngest, handlePresence, handleVitalsIngest } from '@airbotics-modules/mqtt-handlers';
import { logger } from './logger';

const client = mqtt.connect(`${config.MQTT_ORIGIN}:${config.MQTT_PORT}`, {
    clientId: config.MQTT_USERNAME,
    clean: false,
    connectTimeout: config.MQTT_CONNECT_TIMEOUT,
    username: config.MQTT_USERNAME,
    password: config.MQTT_PASSWORD,
    reconnectPeriod: config.MQTT_RECONNECT_PERIOD,
    protocolVersion: 5
});


const supportedTopics: ISupportedTopic[] = [
    {
        id: 'presence',
        regex: new RegExp(`^.{36}\/[a-zA-Z][a-zA-Z0-9_-]{2,29}\/presence$`),
        handler: handlePresence,
        qos: 0
    },
    {
        id: 'commands/confirm',
        regex: new RegExp(`^.{36}\/[a-zA-Z][a-zA-Z0-9_-]{2,29}\/commands\/confirm$`),
        handler: handleCmdConfirm,
        qos: 1
    },
    {
        id: 'containers/confirm',
        regex: new RegExp(`^.{36}\/[a-zA-Z][a-zA-Z0-9_-]{2,29}\/containers\/confirm$`),
        handler: handleContainerConfirm,
        qos: 1
    },
    { 
        id: 'logs/ingest', 
        regex: new RegExp(`^.{36}\/[a-zA-Z][a-zA-Z0-9_-]{2,29}\/logs\/ingest$`),
        handler: handleLogsIngest,
        qos: 1
    },
    { 
        id: 'vitals/ingest', 
        regex: new RegExp(`^.{36}\/[a-zA-Z][a-zA-Z0-9_-]{2,29}\/vitals\/ingest$`),
        handler: handleVitalsIngest,
        qos: 0
    },
    { 
        id: 'data/ingest', 
        regex: new RegExp(`^.{36}\/[a-zA-Z][a-zA-Z0-9_-]{2,29}\/data\/ingest$`),
        handler: handleDataIngest,
        qos: 1
    },
];


client.on('connect', () => {
    logger.info('connected to mqtt broker');

    // subscribe to all supported topics
    for (const topic of supportedTopics) {
        client.subscribe(`+/+/${topic.id}`, { qos: topic.qos });
    }

});

client.on('reconnect', () => {
    logger.warn('reconnected to mqtt broker');
});

client.on('error', error => {
    logger.error('error connecting to mqtt broker');
    logger.error(error);
});

client.on('disconnect', () => {
    logger.warn('disconnected from mqtt broker');
});

client.on('close', () => {
    logger.warn('connection to mqtt broker closed');
});

client.on('message', async (topic, payloadStr, packet) => {

    // console.log('air-mqtt-version: ' + packet.properties!.userProperties!['air-mqtt-version'])

    const message: IMqttMessage = {
        payload: JSON.parse(payloadStr.toString()),
        tenant_uuid: topic.split('/')[0],
        robot: {
            uuid: '',
            id: topic.split('/')[1],
        }
    };

    // make sure the robot exists
    const robot = await prisma.robot.findUnique({
        select: { uuid: true },
        where: {
            id_tenant_uuid: {
                id: message.robot.id,
                tenant_uuid: message.tenant_uuid
            }
        }
    });

    if (!robot) {
        logger.warn('received an mqtt message for a robot that does not exist in this tenant');
        return;
    }

    message.robot.uuid = robot.uuid;

    for (const supportedTopic of supportedTopics) {
        if (supportedTopic.regex.test(topic)) {
            await supportedTopic.handler(message);
            break;
        }
    }
});

export { client };