import express, { Request, Response } from 'express';
import { prisma } from '@airbotics-core/drivers';
import { ITenantDetail, ITenantMember, ITenantOverview } from '@airbotics-types';
import { mustBeAuthenticated } from 'src/middleware';
import { ServerErrorResponse, SuccessJsonResponse, SuccessMessageResponse } from '@airbotics-core/responses';
import { logger } from '@airbotics-core/logger';


/**
 * @description Get details about requesters tenant
 */
export const getTenantDetail = async (req: Request, res: Response) => {

    try {

        const tenant = await prisma.tenant.findUniqueOrThrow({
            where: {
                uuid: req.user!.tenant_uuid
            }
        });

        const response: ITenantDetail = {
            uuid: tenant.uuid,
            name: tenant.name,
            created_at: tenant.created_at.toISOString()
        };

        logger.info('a user has gotten details about their tenant');
        return new SuccessJsonResponse(res, response);

    } catch (error) {
        logger.error('a user is trying to get details about their tenant, but it cant be found');
        return new ServerErrorResponse(res);
    }
}




/**
 * @description Update tenant details
 */
export const updateTenantDetails = async (req: Request, res: Response) => {

    const {
        name
    } = req.body;

    try {

        await prisma.tenant.update({
            where: {
                uuid: req.user!.tenant_uuid
            },
            data: {
                name
            }
        });

        logger.info('a user has updated details about their tenant');
        return new SuccessMessageResponse(res, 'You have updated the name of your team.');

    } catch (error) {
        logger.error(error);
        return new ServerErrorResponse(res);
    }
}




/**
 * @description Get members of tenant
 */
export const getTenantMembers = async (req: Request, res: Response) => {

    try {

        const tenant = await prisma.tenant.findUniqueOrThrow({
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

        const response: ITenantMember[] = tenant.accounts.map(at => ({
            uuid: at.account_uuid,
            email: at.account.email,
            first_name: at.account.first_name,
            last_name: at.account.last_name,
            role: at.role
        }));

        logger.info('a user has listed members in their tenant');
        return new SuccessJsonResponse(res, response);

    } catch (error) {
        logger.error('a user is trying to get details about their tenant, but it cant be found');
        return new ServerErrorResponse(res);
    }

}


/**
 * @description Get overview of tenant
 */
export const getTenantOverview = async (req: Request, res: Response) => {

    const tenant = await prisma.tenant.findUnique({
        where: {
            uuid: req.user!.tenant_uuid
        },
        include: {
            robots: true,
            commands: true,
        }
    });

    if (!tenant) {
        logger.error('a user is trying to get an overview about their tenant, but it cant be found');
        return new ServerErrorResponse(res);
    }

    const num_robots = await prisma.robot.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        }
    });
    const num_commands = await prisma.command.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        }
    });
    const num_online_robots = await prisma.robot.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid,
            online: true
        }
    });
    const num_compose_files = await prisma.composeFile.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        }
    });
    const num_logs = await prisma.log.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        }
    });
    const num_streams = await prisma.stream.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        }
    });
    const num_data_points = await prisma.dataPoint.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        }
    });
    const num_vitals = await prisma.vital.count({
        where: {
            tenant_uuid: req.user!.tenant_uuid
        }
    });

    const response: ITenantOverview = {
        totals: {
            num_robots,
            num_commands,
            num_compose_files,
            num_logs,
            num_streams,
            num_data_points,
            num_vitals
        },
        connectivity_breakdown: {
            online: num_online_robots,
            offline: num_robots - num_online_robots
        }
    };

    logger.info('a user has gotten an overview of their tenant');
    return new SuccessJsonResponse(res, response);

};
