import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { createCommand, paginate, pathUuid, robotId } from '@airbotics-core/schemas';
import * as controller from './controller';


const router = express.Router();

router.post('/robots/:id/commands',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.CommandsWrite),
    validate(createCommand, EValidationSource.Body),
    controller.sendCommand);

router.get('/commands',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.CommandsRead),
    validate(paginate, EValidationSource.Path),
    controller.listCommands);

router.get('/commands/:id',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.CommandsRead),
    validate(pathUuid, EValidationSource.Path),
    controller.getCommandDetail);

router.delete('/commands/:id',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.CommandsWrite),
    validate(pathUuid, EValidationSource.Path),
    controller.deleteCommand);

router.get('/robots/:id/commands',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.CommandsRead),
    validate(robotId, EValidationSource.Path),
    validate(paginate, EValidationSource.Query),
    controller.listRobotCommands);

export default router;