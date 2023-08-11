import express from 'express';
import { mustBeAuthenticated, mustBeAuthorised, validate } from '@airbotics-middleware';
import { EValidationSource, Permissions } from '@airbotics-core/consts';
import * as controller from './controller';
import { updateTenant } from '@airbotics-core/schemas';

const router = express.Router();

router.get('/tenant',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.TenantsRead),
    controller.getTenantDetail);

router.patch('/tenant',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.TenantsWrite),
    validate(updateTenant, EValidationSource.Body),
    controller.updateTenantDetails);

router.get('/tenant/members',
    mustBeAuthenticated,
    mustBeAuthorised(Permissions.TenantsRead),
    controller.getTenantMembers);

router.get('/tenant/overview', 
    mustBeAuthenticated, 
    mustBeAuthorised(Permissions.TenantsRead),
    controller.getTenantOverview);

export default router;