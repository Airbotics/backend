
export const DEFAULT_SKIP = 0;
export const DEFAULT_TAKE = 50;
export const DEFAULT_DATA_TAKE = 1000;

export enum Permissions {
    ApiKeysWrite = 'api_keys:write',
    ApiKeysRead = 'api_keys:read',
    TenantsWrite = 'tenants:write',
    TenantsRead = 'tenants:read',
    CommandsWrite = 'commands:write',
    CommandsRead = 'commands:read',
    ComposeFilesWrite = 'compose_files:write',
    ComposeFilesRead = 'compose_files:read',
    RobotsComposeFilesWrite = 'robots_compose_files:write',
    RobotsComposeFilesRead = 'robots_compose_files:read',
    RobotsWrite = 'robots:write',
    RobotsRead = 'robots:read',
    LogsWrite = 'logs:write',
    LogsRead = 'logs:read',
    DataRead = 'data:read',
    DataWrite = 'data:write',
}

export const enum EValidationSource {
    Body = 'body',
    Headers = 'headers',
    Query = 'query',
    Path = 'params'
}


export enum CommandsInterface {
    Topic = 'topic',
    Service = 'service',
    ActionSendGoal = 'action_send_goal'
}


export enum CloudToRobotTopics {
    CommandsSend = 'commands/send',
    ContainersConfig = 'containers/config',
    LogsConfig = 'logs/config',
    DataConfig = 'data/config',
    VitalsConfig = 'vitals/config',
}


