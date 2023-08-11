import axios from 'axios';
import express, { Request, Response } from 'express';
import passport from 'passport';
import { pwdHash } from '@airbotics-core/utils';
import { prisma } from '@airbotics-core/drivers';
import { mustBeAuthenticated } from '../../middleware';
import { AccountTenantRole } from '@prisma/client';
import { BadResponse, ServerErrorResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { IAccount } from '@airbotics-types';
import { config } from '@airbotics-core/config';
import { logger } from '@airbotics-core/logger';



/**
 * 
 */
export const createAccount = async (req: Request, res: Response) => {
    {

        const {
            email,
            password,
            first_name,
            last_name
        } = req.body;
    
        const existingAccount = await prisma.account.findUnique({
            where: {
                email
            }
        });
    
        if (existingAccount) {
            logger.warn('a user is trying to create an account with an existing email');
            return new BadResponse(res, 'account_already_exists', 'An account with that email already exists');
        }
    
    
        const tenant = await prisma.tenant.create({
            data: {
                name: email.split('@')[0]
            }
        });
    
        const account = await prisma.account.create({
            data: {
                first_name: first_name,
                last_name: last_name,
                email: email,
                password: pwdHash(password),
            }
        });
    
        await prisma.accountTenant.create({
            data: {
                account_uuid: account.uuid,
                tenant_uuid: tenant.uuid,
                role: AccountTenantRole.owner
            }
        });
    
        const response: IAccount = {
            uuid: account.uuid,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            created_at: account.created_at,
        };
    
        logger.info('a user has registered an account');
        return new SuccessJsonResponse(res, response);
    
    }
}


/**
 * 
 */
export const login = async (req: Request, res: Response) => {

    const ta = await prisma.tenant.findUnique({
        where: {
            uuid: req.user!.tenant_uuid
        },
        include: {
            accounts: {
                include: {
                    account: true
                }
            }
        }
    });


    if (!ta) {
        logger.error('something went wrong getting the tenant of an account when logging in');
        return new ServerErrorResponse(res);
    }

    // get the first account
    const account = ta.accounts[0].account;

    const response: IAccount = {
        uuid: account.uuid,
        first_name: account.first_name,
        last_name: account.last_name,
        email: account.email,
        created_at: account.created_at,
    };

    logger.info('a user has logged into an account');
    return new SuccessJsonResponse(res, response);

}


/**
 * 
 */
export const logout = async (req: Request, res: Response) => {

    req.session.destroy(error => {
        if (error) {
            logger.error(error)
            return new ServerErrorResponse(res);
        } else {
            res.clearCookie(config.COOKIE_NAME);
            logger.info('a user has logged out of an account');
            return new SuccessMessageResponse(res, 'You have logged out.');
        }
    });

}


/**
 * 
 */
export const getAccount = async (req: Request, res: Response) => {

    // get the first account in the tenant, only one account will be in the tenant for now

    const ta = await prisma.tenant.findUnique({
        where: {
            uuid: req.user!.tenant_uuid
        },
        include: {
            accounts: {
                include: {
                    account: true
                }
            }
        }
    });


    if (!ta) {
        logger.warn('something went wrong getting the tenant of an account on whoami')
        return new ServerErrorResponse(res);
    }

    // get the first account
    const account = ta.accounts[0].account;

    const response: IAccount = {
        uuid: account.uuid,
        first_name: account.first_name,
        last_name: account.last_name,
        email: account.email,
        created_at: account.created_at,
    };

    return new SuccessJsonResponse(res, response);
}


/**
 * @description Delete account.
 * TODO these should happen in a transaction
 */
export const deleteAccount = async (req: Request, res: Response) => {

    // delete the session
    req.session.destroy(async error => {
        if (error) {
            logger.error(error)
            return new ServerErrorResponse(res);

        } else {

            // delete the cookie
            res.clearCookie(config.COOKIE_NAME);

            const tenant = await prisma.tenant.findUnique({
                where: {
                    uuid: req.user!.tenant_uuid
                },
                include: {
                    accounts: true,
                    robots: true
                }
            });

            if(!tenant) {
                logger.warn('something went wrong getting the tenant when trying to delete it')
                return new ServerErrorResponse(res);
            }

            await prisma.robot.deleteMany({
                where: {
                    uuid: {
                        in: tenant.robots.map(e => e.uuid)
                    }
                }
            });

            await prisma.account.delete({
                where: {
                    uuid: tenant?.accounts[0].account_uuid
                }
            });

            await prisma.tenant.delete({
                where: {
                    uuid: req.user!.tenant_uuid
                }
            });
            
            
            // delete all robots
            for(const robot of tenant.robots) {
                const axiosAuth = {
                    username: config.MQTT_API_KEY!,
                    password: config.MQTT_API_SECRET!
                };
    
                let mqttUserUrl;
                let mqttRuleUrl;
    
                if(config.NODE_ENV === 'development') {
                    mqttUserUrl = `${config.MQTT_ADMIN_HOST}/authentication/password_based:built_in_database/users/${robot.tenant_uuid}-${robot.id}`;
                    mqttRuleUrl = `${config.MQTT_ADMIN_HOST}/authorization/sources/built_in_database/rules/users/${robot.tenant_uuid}-${robot.id}`;
                }
    
                else {
                    mqttUserUrl = `${config.MQTT_ADMIN_HOST}/auth_username/${robot.tenant_uuid}-${robot.id}`
                    mqttRuleUrl = `${config.MQTT_ADMIN_HOST}/acl/username/${robot.tenant_uuid}-${robot.id}/topic/${robot.tenant_uuid}%2F${robot.id}%2F%23`
                }
            
                await axios.delete(mqttUserUrl, { auth: axiosAuth });
                await axios.delete(mqttRuleUrl, { auth: axiosAuth });
    
            }

            logger.info('a user has deleted their account');
            return new SuccessMessageResponse(res, 'You have deleted your account.');
        }
    });
}