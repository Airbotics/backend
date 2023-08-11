import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { configureLogs, createStream, getData, paginate, robotId, updateStreamBody, updateStreamPath } from '@airbotics-core/schemas';
import * as controller from './controller';


const router = express.Router();

router.post('/robots/:id/streams',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.DataWrite),
    validate(robotId, EValidationSource.Path),
    validate(createStream, EValidationSource.Body),
    controller.createStream);

router.get('/robots/:id/streams',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.DataRead),
    validate(robotId, EValidationSource.Path),
    controller.listStreams);

router.patch('/robots/:id/streams/:source',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.DataWrite),
    validate(updateStreamPath, EValidationSource.Path),
    validate(updateStreamBody, EValidationSource.Body),
    controller.updateStream);

router.delete('/robots/:id/streams/:source',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.DataWrite),
    validate(updateStreamPath, EValidationSource.Path),
    controller.deleteStream);

router.get('/robots/:id/data',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.DataRead),
    validate(robotId, EValidationSource.Path),
    validate(getData, EValidationSource.Query),
    controller.getData);

export default router;