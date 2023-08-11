import { prisma } from '@airbotics-core/drivers';
import { pwdHash } from '@airbotics-core/utils';
import { UniqueTokenOptions, UniqueTokenStrategy } from 'passport-unique-token/dist/strategy';
import { PassportUser } from '@airbotics-types';


const strategyOptions: UniqueTokenOptions = {
    tokenHeader: 'air-api-key',
    failOnMissing: true,
}


export const tokenStrategy = new UniqueTokenStrategy(strategyOptions, async (token, done) => {
    try {

        const key = await prisma.apiKey.findUniqueOrThrow({
            select: { tenant_uuid: true, permissions: true },
            where: { value: pwdHash(token) }
        });

        const user: PassportUser = {
            tenant_uuid: key.tenant_uuid,
            permissions: key.permissions
        };

        return done(null, user);

    } catch {
        return done(null, false);
    }
}
)
