import Joi, { boolean, number } from 'joi';
import { CommandsInterface, Permissions } from './consts';



// must be greater than 3 characters, less than 30, must start with a lowercase or uppercase letter and after that can contain lowercase letters, uppercase letters, numbers, hyphens or underscores, no space, no special characters
const slugRegex = '^[a-zA-Z][a-zA-Z0-9_-]{2,29}$'
const slugField = Joi.string().pattern(new RegExp(slugRegex));

// at least one uppercase, at least one lowercase, at least one number, at least oen special character, at least 8 characters long
const passwordRegex = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^A-Za-z0-9]).{8,}$'
const passwordField = Joi.string().pattern(new RegExp(passwordRegex));

const nameField = Joi.string().min(3).max(100);

// a uuid used in url params
export const pathUuid = Joi.object({
    id: Joi.string().guid().required()
});

export const robotId = Joi.object({
    id: slugField.required()
});

export const composeFileId = Joi.object({
    id: slugField.required()
});

export const paginate = Joi.object({
    offset: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).max(1000).optional()
});


export const createApiKey = Joi.object({
    name: nameField.required(),
    permissions: Joi.array().items(Joi.string().valid(
        Permissions.CommandsWrite,
        Permissions.CommandsRead,
        Permissions.ComposeFilesWrite,
        Permissions.ComposeFilesRead,
        Permissions.RobotsComposeFilesWrite,
        Permissions.RobotsComposeFilesRead,
        Permissions.RobotsWrite,
        Permissions.RobotsRead,
        Permissions.LogsWrite,
        Permissions.LogsRead,
        Permissions.DataRead,
        Permissions.DataWrite
    )).min(1).required()
});

export const createCommand = Joi.object({
    interface: Joi.string().valid(...Object.values(CommandsInterface)).required(),
    name: Joi.string().required(),
    type: Joi.string().required(),
    payload: Joi.object().required()
});

export const putComposeOnRobot = Joi.object({
    id: slugField.required()
});


export const createRobot = Joi.object({
    id: slugField.required().messages({
        'string.pattern.base': 'id must start with a letter and only contain alphanumeric characters, underscores and hyphens'
    }),
    name: nameField.allow('').optional()
});


export const configureVitals = Joi.object({
    enabled: Joi.boolean().required()
});


export const configureLogs = Joi.object({
    enabled: Joi.boolean().required()
});


export const updateTenant = Joi.object({
    name: nameField.optional()
});

export const createAccount = Joi.object({
    first_name: nameField.required(),
    last_name: nameField.required(),
    email: Joi.string().email().required(),
    password: passwordField.required().messages({
        'string.pattern.base': 'password must have one lowercase, one uppercase, one digit and be 8 characters long'
    })
});

export const login = Joi.object({
    email: Joi.string().email().required(),
    password: passwordField.required().messages({
        'string.pattern.base': 'password must have one lowercase, one uppercase, one digit and be 8 characters long'
    })
});


export const createComposeFile = Joi.object({
    id: slugField.required().messages({
        'string.pattern.base': 'id must start with a letter and only contain alphanumeric characters, underscores and hyphens'
    }),
    name: nameField.allow('').optional(),
    content: Joi.object().required() // NOTE it could be nice to validate this is an actual compose file
});

export const getVitals = Joi.object({
    offset: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).max(1000).optional(), 
    latest_only: Joi.boolean().optional()
});


export const createStream = Joi.object({
    source: Joi.string().required(),
    type: Joi.string().required(),
    hz: Joi.number().required()
});


export const updateStreamPath = Joi.object({
    id: slugField.required(),
    source: Joi.string().required()
});

export const updateStreamBody = Joi.object({
    enabled: Joi.boolean().optional(),
    hz: Joi.number().optional()
}).min(1);


export const getData = Joi.object({
    source: Joi.string().required(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    offset: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).max(1000).optional(), 
    latest_only: Joi.boolean().optional()
});