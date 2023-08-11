import { Response } from 'express';


export class SuccessMessageResponse {
    constructor(res: Response, message: string) {
        return res.status(200).json({ message });
    }
}

export class SuccessJsonResponse {
    constructor(res: Response, body: object) {
        return res.status(200).json(body);
    }
}

export class UnauthenticatedResponse {
    constructor(res: Response) {
        return res.status(401).json({ error_code: 'unauthenticated', message: 'Not authenticated.' });
    }
}

export class UnauthorisedResponse {
    constructor(res: Response) {
        return res.status(403).json({ error_code: 'unauthorised', message: 'Not authorised.' });
    }
}

export class BadResponse {
    constructor(res: Response, error_code: string, message: string) {
        return res.status(400).json({ error_code, message });
    }
}

export class NotFoundResponse {
    constructor(res: Response, message: string) {
        return res.status(404).json({ error_code: 'not_found', message });
    }
}

export class ServerErrorResponse {
    constructor(res: Response) {
        return res.status(500).json({ error_code: 'internal_server_error', message: 'An unknown occurred.' });
    }
}