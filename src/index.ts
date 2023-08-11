import http from 'http';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import session from 'express-session';
import helmet from 'helmet';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { config } from '@airbotics-core/config';
import { prisma } from '@airbotics-core/drivers';
import commands from '@airbotics-modules/commands';
import robots from '@airbotics-modules/robots';
import apiKeys from '@airbotics-modules/api_keys';
import logs from '@airbotics-modules/logs';
import data from '@airbotics-modules/data';
import tenants from '@airbotics-modules/tenants';
import containers from '@airbotics-modules/containers';
import onboarding from '@airbotics-modules/onboarding';
import vitals from '@airbotics-modules/vitals';
import { tokenStrategy } from '@airbotics-core/auth/token';
import { localStrategy } from '@airbotics-core/auth/local';
import { NotFoundResponse, ServerErrorResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';
import { PassportUser } from './types';

declare global {
    namespace Express {
        interface User {
            tenant_uuid: string;
            permissions: string[];
        }
    }
}

const app = express();

const corsConfig = (req: Request, callback: any) => {
    if (req.header('Origin') === config.CORS_ORIGIN) {
        callback(null, {
            origin: config.CORS_ORIGIN,
            credentials: true
        });
    } else {
        callback(null, {
            origin: '*',
            credentials: false
        });
    }
}
app.use(cors(corsConfig));
app.use(express.json());
app.use(helmet());

app.use(session({
    secret: config.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
    proxy: true,
    rolling: true,
    name: config.COOKIE_NAME,
    cookie: config.COOKIE_CONFIG,
    store: new PrismaSessionStore(prisma, {
        checkPeriod: config.SESSION_CHECK_PERIOD,
        dbRecordIdIsSessionId: true
    })
}));

// Init passport
app.use(passport.initialize());


// Register passport strategies
passport.use('local', localStrategy);
passport.use('token', tokenStrategy);


// Called after successful login is made, for now put the whole object in
passport.serializeUser((user: PassportUser, done) => {
    done(null, user);
});

// called every time a request with a valid session is made
passport.deserializeUser((user: PassportUser, done) => {
    done(null, user);
});

// For every request, attempt to populate req.passport
app.use(passport.session());


// health check
app.get('/', (req, res) => {
    res.send('Welcome to the Airbotics API.');
})

// mount modules
app.use(robots, apiKeys, commands, onboarding, tenants, containers, logs, data, vitals);


// catch 404s
app.use((req, res, next) => {
    // logger.warn(`404 ${req.method} ${req.originalUrl}`);
    return new NotFoundResponse(res, 'That resource could not be found');
});

// catch 500s
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(error)
    // logger.error(error);
    return new ServerErrorResponse(res);
});



// start server
const httpServer = http.createServer(app);


httpServer.listen(config.SERVER_PORT, async () => {
    logger.info(`listening on ${config.SERVER_PORT}`);
});