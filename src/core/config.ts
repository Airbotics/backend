import dotenv from 'dotenv';

dotenv.config();

export const config = {

    SERVER_PORT: Number(process.env.SERVER_PORT),
    NODE_ENV: process.env.NODE_ENV,

    TIMESCALE_USERNAME: process.env.TIMESCALE_USERNAME,
    TIMESCALE_PASSWORD: process.env.TIMESCALE_PASSWORD,
    TIMESCALE_HOST: process.env.TIMESCALE_HOST,
    TIMESCALE_PORT: Number(process.env.TIMESCALE_PORT),
    TIMESCALE_DATABASE: process.env.TIMESCALE_DATABASE,

    MQTT_API_VERSION: process.env.MQTT_API_VERSION,
    MQTT_ORIGIN: process.env.MQTT_ORIGIN,
    MQTT_PORT: Number(process.env.MQTT_PORT),
    MQTT_USERNAME: process.env.MQTT_USERNAME,
    MQTT_PASSWORD: process.env.MQTT_PASSWORD,
    MQTT_CONNECT_TIMEOUT: Number(process.env.MQTT_CONNECT_TIMEOUT),
    MQTT_RECONNECT_PERIOD: Number(process.env.MQTT_RECONNECT_PERIOD),
    MQTT_ADMIN_HOST: process.env.MQTT_ADMIN_HOST,
    MQTT_API_KEY: process.env.MQTT_API_KEY,
    MQTT_API_SECRET: process.env.MQTT_API_SECRET,
    

    AUTH_ENABLED: process.env.AUTH_ENABLED === 'true',
    PWD_SALT: process.env.PWD_SALT,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SESSION_CHECK_PERIOD: 1000 * 60 * 5,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    COOKIE_NAME: 'air',
    COOKIE_CONFIG: {
        domain: process.env.COOKIE_DOMAIN,
        path: '/',
        httpOnly: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 5 // 5 days
    }

};