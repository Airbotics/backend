import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { configureLogs, paginate, robotId } from '@airbotics-core/schemas';
import * as controller from './controller';


const router = express.Router();

router.patch('/robots/:id/logs/config',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.LogsWrite),
    validate(robotId, EValidationSource.Path),
    validate(configureLogs, EValidationSource.Body),
    controller.configureLogs);

router.get('/robots/:id/logs/config',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.LogsRead),
    validate(robotId, EValidationSource.Path),
    controller.getLogsConfiguration);

router.get('/robots/:id/logs',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.LogsRead),
    validate(paginate, EValidationSource.Query),
    validate(robotId, EValidationSource.Path),
    controller.getLogs);

router.delete('/robots/:id/logs',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.LogsWrite),
    validate(robotId, EValidationSource.Path),
    controller.deleteLogs);

export default router;