import { PrismaClient } from '@prisma/client';
import { config } from '@airbotics-core/config';

const connStr = `postgresql://${config.TIMESCALE_USERNAME}:${config.TIMESCALE_PASSWORD}@${config.TIMESCALE_HOST}:${config.TIMESCALE_PORT}/${config.TIMESCALE_DATABASE}`;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connStr
        }
    }
});

export default prisma
