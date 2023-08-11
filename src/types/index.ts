import mqtt from 'mqtt';

export interface PassportUser {
    tenant_uuid: string;
    permissions: string[];
}

export interface IAccount {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: Date;
}

/**
 * tenant
 */
export interface ITenantDetail {
    uuid: string;
    name: string;
    created_at: string;
}

export interface ITenantMember {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}


export interface ITenantOverview {
    totals: {
        num_robots: number;
        num_commands: number;
        num_compose_files: number;
        num_logs: number;
        num_streams: number;
        num_data_points: number;
        num_vitals: number;
    };
    connectivity_breakdown: {
        online: number;
        offline: number;
    };
}



/**
 * api keys
 */
export interface IApiKey {
    uuid: string;
    name: string;
    hint: string;
    permissions: string[];
    created_at: Date;
}

/**
 * robots
 */

export interface IRobotCreated {
    robot_id: string;
    tenant_uuid: string;
    token: string;
}

export interface IRobot {
    id: string;
    name: string;
    token_hint: string;
    provisioned: boolean;
    agent_version: string | null;
    online_updated_at: Date | null;
    online: boolean | null;
    created_at: Date;
    vitals: null | {
        cpu: number;
        battery: number;
        ram: number;
        disk: number;
    }
}


export interface IComposeFile {
    id: string;
    name: string;
    content: object;
    created_at: Date;
}

export interface IRobotComposeFile extends IComposeFile {
    state: string;
    error_code: string | null;
}

export interface ICommand {
    uuid: string;
    robot_id: string;
    state: string; // enum
    error_code: string | null;
    interface: string;
    name: string;
    type: string;
    payload: object;
    created_at: Date;
}

export interface IStream {
    uuid: string;
    source: string;
    source_encoded: string;
    type: string;
    hz: number;
    enabled: boolean;
    created_at: Date;
    first_recording: Date | null;
    last_recording: Date | null;
    num_recordings: number;
}

export interface ILog {
    uuid: string;
    stamp: Date;
    level: string;
    name: string;
    file: string;
    function: string;
    line: number;
    msg: string;
}

export interface ILogsConfig {
    enabled: boolean;
    first_recording: Date | null;
    last_recording: Date | null;
    num_recordings: number;
}


export interface IVital {
    uuid: string;
    created_at: Date;
    battery: number;
    cpu: number;
    ram: number;
    disk: number;
}

export interface IMqttMessage {
    payload: any,
    tenant_uuid: string,
    robot: {
        uuid: string,
        id: string
    }
}


export interface ISupportedTopic {
    id: string;
    regex: RegExp;
    handler: (message: IMqttMessage) => Promise<void>;
    qos: mqtt.QoS;
}