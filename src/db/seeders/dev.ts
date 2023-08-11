import { prisma } from '@airbotics-core/drivers';
import { pwdHash } from '@airbotics-core/utils';
import { AccountTenantRole } from '@prisma/client';

(async () => {

    try {

        await prisma.$transaction(async (tx) => {

            const devTennant = await tx.tenant.create({
                data: {
                    uuid: '11111111-1111-1111-1111-111111111111',
                    name: 'ACME'
                }
            });

            const devAccount = await tx.account.create({
                data: {
                    uuid: '11111111-1111-1111-1111-111111111111',
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john@acme.com',
                    password: pwdHash('pass'),
                }
            });

            const accountTenant = await tx.accountTenant.create({
                data: {
                    account_uuid: devAccount.uuid,
                    tenant_uuid: devTennant.uuid,
                    role: AccountTenantRole.owner
                }
            });

        });

        console.log("dev seeder ok");

    } catch (e) {
        console.log("dev seeder error");
        console.log(e);
    }

})();