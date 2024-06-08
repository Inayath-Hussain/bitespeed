import { RequestHandler } from "express"
import { isEmail } from "validator";
import { sanitizeAll } from "./sanitize";

export interface IdentifyBody {
    email?: string
    phoneNumber?: number
}


export const validateIdentifyBody: RequestHandler<{}, {}, IdentifyBody> = (req, res, next) => {

    // sanitize email and phoneNumber
    sanitizeAll(req.body);

    const { email, phoneNumber } = req.body;

    // check
    // atleast one should be present
    // email is valid format

    switch (true) {
        // check if both values are not falsy 
        case (!email && !phoneNumber):
            return res.status(400).json({ message: "Either email or phoneNumber should be provided" })

        // check if email is valid
        case (email && isEmail(email) === false):
            return res.status(400).json({ message: "Invalid email" })

        // check if phoneNumber is valid
        case (phoneNumber && typeof phoneNumber !== "number"):
            return res.status(400).json({ message: "Invalid phoneNumber" })
    }


    next();
}




class Error {
    message: string;
    errors: Partial<Record<keyof IdentifyBody, string>>

    constructor(message: string, errors: Error["errors"] = {}) {
        this.message = message;
        this.errors = errors
    }


    addFieldErrors(key: keyof Error["errors"], errorMessage: string) {
        this.errors[key] = errorMessage;
    }
}