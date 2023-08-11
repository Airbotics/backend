import { CommandState } from '@prisma/client';
import { prismaMock } from '../singleton';
import { listCommands } from '@airbotics-modules/commands/controller';
import { Request, Response } from 'express';
import { ICommand } from 'src/types';


// Mock the MQTT client
jest.mock('@airbotics-core/mqtt', () => ({
    client: {
        connect: jest.fn(),
        on: jest.fn(),
    },
}));

const mockedTenantId = '11111111-1111-1111-1111-111111111111';


describe('listCommands', () => {

    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {

        mockReq = {
            user: {
                tenant_uuid: mockedTenantId,
                permissions: []
            }
        }

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

    })

    // test('should fetch and return an empty list of commands', async () => {

    //     prismaMock.command.findMany.mockResolvedValue([]);

    //     await listCommands(mockReq as Request, mockRes as Response);

    //     expect(mockRes.status).toHaveBeenCalledWith(200);
    //     expect(mockRes.json).toHaveBeenCalledWith([]);

    // })

    test('should fetch and return a list of', async () => {

        // mock what prisma returns, this type should match the query type!!
        const mockedCommands: any = [
            {
                uuid: '1234',
                state: CommandState.created,
                interface: 'topic',
                name: 'cmdVel',
                type: 'std_msgs/String',
                error_code: null,
                created_at: new Date(),
                payload: { data: 'hello' },
                robot: { id: '1234' }
            }
        ];

        // expected api response
        const expectedResponse: ICommand[] = [
            {
                uuid: '1234',
                robot_id: '1234',
                state: CommandState.created,
                interface: 'topic',
                name: 'cmdVel',
                type: 'std_msgs/String',
                error_code: null,
                created_at: new Date(),
                payload: { data: 'hello' }
            }
        ]

        prismaMock.command.findMany.mockResolvedValue(mockedCommands);

        await listCommands(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);

    })

})



/*

const mockedRobot: Robot = {
    uuid: '11111111-1111-1111-1111-111111111111',
    id: 'mock',
    name: 'mock-bot',
    token_hint: 'mock-hint',
    token_value: 'mock-val',
    online_updated_at: new Date(),
    online: true,
    agent_version: 'v1',
    created_at: new Date('2023-01-01'),
    tenant_uuid: mockedTenantId
}

*/
