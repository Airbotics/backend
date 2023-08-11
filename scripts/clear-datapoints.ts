import { prisma } from '../src/core/drivers';

(async () => {

    await prisma.dataPoint.deleteMany();

})();