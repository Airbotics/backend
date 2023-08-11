import express from 'express';
import passport from 'passport';
import { mustBeAuthenticated, mustNotBeAuthenticated, validate } from '../../middleware';
import { EValidationSource } from '@airbotics-core/consts';
import { createAccount, login } from '@airbotics-core/schemas';
import * as controller from './controller';


const router = express.Router();

router.post('/register',
    mustNotBeAuthenticated,
    validate(createAccount, EValidationSource.Body),
    controller.createAccount
);
 
router.post('/login',
    mustNotBeAuthenticated,
    passport.authenticate('local'),
    validate(login, EValidationSource.Body),
    controller.login
);

router.post('/logout',
    mustBeAuthenticated,
    controller.logout
)

router.get('/whoami',
    mustBeAuthenticated,
    controller.getAccount
);

router.delete('/account',
    mustBeAuthenticated,
    controller.deleteAccount
);


export default router;