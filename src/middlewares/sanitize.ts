import { trim } from "validator"

const sanitize = (value: any) => {
    if (typeof value === "string") return trim(value)
    return value
}


/**
 * runs basic sanitization to a request body or any object and replaces their value with sanitized version
 * @param obj - request body or any object
 * @returns 
 */
export const sanitizeAll = (obj: any) => {
    for (let index in obj) {
        const sanitizedValue = sanitize(obj[index])
        obj[index] = sanitizedValue
    }

    return obj
}