import winston from 'winston';
import { config } from './config';

const consoleTransport = new winston.transports.Console();


export const logger = winston.createLogger({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.json()
    ),
    transports: [
        consoleTransport
    ],
    rejectionHandlers: [
        consoleTransport
    ]
});