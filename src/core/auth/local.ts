import { prisma } from '@airbotics-core/drivers';
import { IStrategyOptions, Strategy as LocalStrategy } from 'passport-local';
import { pwdHash } from '@airbotics-core/utils';
import { PassportUser } from '@airbotics-types';
import { Permissions } from '@airbotics-core/consts'
import { AccountTenantRole } from '@prisma/client';


const strategyOptions: IStrategyOptions = {
    usernameField: 'email',
    session: true
}


export const localStrategy = new LocalStrategy(strategyOptions, async (email, password, done) => {
        try {

            const user = await prisma.account.findUniqueOrThrow({
                where: {
                    email: email
                },
                include: { tenants: true }
            });

            const hashedAttempt = pwdHash(password);

            if(hashedAttempt !== user.password) {
                return done(null, false, { message: 'invalid email or password'});
            }

            let permissions: string[] = [];

            if(user.tenants[0].role === AccountTenantRole.owner) {
                permissions = Object.values(Permissions)
            }
            
            // Assume user only belongs to one tenant for now and dashboard users have all permissions
            const passportUser: PassportUser = { 
                tenant_uuid: user.tenants[0].tenant_uuid,
                permissions: permissions

            };
            
            return done(null, passportUser);
                
        } catch(e) {
            return done(null, false, { message: 'invalid email or password'});
        }
    }
)

