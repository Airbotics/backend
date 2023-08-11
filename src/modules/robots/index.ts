import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { createRobot, robotId } from '@airbotics-core/schemas';
import * as controller from './controller';


const router = express.Router();

router.post('/robots',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsWrite),
    validate(createRobot, EValidationSource.Body),
    controller.createRobot);

router.get('/robots',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsRead),
    controller.listRobots);

router.get('/robots/:id',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsRead),
    validate(robotId, EValidationSource.Path),
    controller.getRobotDetail);

router.delete('/robots/:id',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsWrite),
    validate(robotId, EValidationSource.Path),
    controller.deleteRobot);

export default router;