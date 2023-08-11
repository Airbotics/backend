import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { createApiKey, pathUuid } from '@airbotics-core/schemas';
import * as controller from './controller';

const router = express.Router();

router.post('/api-keys',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.ApiKeysWrite),
    validate(createApiKey, EValidationSource.Body),
    controller.createKey);

router.get('/api-keys',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.ApiKeysRead),
    controller.listKeys);

router.delete('/api-keys/:id',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.ApiKeysWrite),
    validate(pathUuid, EValidationSource.Path),
    controller.deleteKey);

export default router;