import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import { composeFileId, createCommand, createComposeFile, pathUuid, putComposeOnRobot, robotId } from '@airbotics-core/schemas';
import * as controller from './controller';

const router = express.Router();

router.post('/compose-files',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.ComposeFilesWrite),
    validate(createComposeFile, EValidationSource.Body),
    controller.createComposeFile);

router.get('/compose-files',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.ComposeFilesRead),
    controller.listComposeFiles);

router.get('/compose-files/:id',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.ComposeFilesRead),
    validate(composeFileId, EValidationSource.Path),
    controller.getComposeFile);

router.delete('/compose-files/:id',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.ComposeFilesWrite),
    validate(composeFileId, EValidationSource.Path),
    controller.deleteComposeFile);

router.post('/robots/:id/compose-file',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsComposeFilesWrite),
    validate(robotId, EValidationSource.Path),
    validate(putComposeOnRobot, EValidationSource.Body),
    controller.putComposeOnRobot);

router.get('/robots/:id/compose-file',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsComposeFilesRead),
    validate(robotId, EValidationSource.Path),
    controller.getComposeOnRobot);

router.delete('/robots/:id/compose-file',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.RobotsComposeFilesWrite),
    validate(robotId, EValidationSource.Path),
    controller.removeComposefromRobot);

export default router;