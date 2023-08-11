import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { getVitals, robotId } from '@airbotics-core/schemas';
import * as controller from './controller';


const router = express.Router();

router.get('/robots/:id/vitals',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsRead),
    validate(getVitals, EValidationSource.Query),
    validate(robotId, EValidationSource.Path),
    controller.getRobotVitals);


router.delete('/robots/:id/vitals',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsWrite),
    validate(robotId, EValidationSource.Path),
    controller.deleteRobotLogs);

export default router;