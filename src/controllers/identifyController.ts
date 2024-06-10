import type { Contact } from "@prisma/client";
import { RequestHandler } from "express";

import { IdentifyBody } from "../middlewares/validateIdentifyBody";
import { contactService } from "../services/contact";


export const identifyController: RequestHandler<{}, {}, IdentifyBody> = async (req, res, next) => {

    const { email, phoneNumber } = req.body;

    try {
        const matchingRecords = await contactService.getMatchingContacts(email, phoneNumber);


        // if no record exists create a new record
        if (matchingRecords.length === 0) {
            const newContact = await contactService.createContact(email, phoneNumber);
            const data = formatData([newContact]);
            return res.status(200).json(data);
        }




        // if there are matching records
        const chain = await getChain(matchingRecords[0]);

        const isSingleChain = checkIfSingleChain(matchingRecords, chain)

        if (isSingleChain.status === true) {
            // if email or phoneNumber is new create a new record and add it to the end of the chain.
            if (checkEmailOrPhoneNumberAreNew(email, phoneNumber, chain)) {
                const newRecord = await contactService.createContact(email, phoneNumber, chain[chain.length - 1].id)
                chain.push(newRecord);
            }

            const data = formatData(chain)

            return res.status(200).json(data);
        }







        // if matching record belong to two different chains
        const { leastUncommonRecord } = isSingleChain;

        const secondChain = await getChain(leastUncommonRecord);

        const secondaryChainPrimaryRecord = secondChain[0];


        // link the secondary chain's primary record to the last record of the first chain.
        const updatedRecord = await contactService.linkContacts(chain[chain.length - 1].id, secondaryChainPrimaryRecord.id);

        // update the primary record of second chain.
        secondChain[0] = updatedRecord;

        const data = formatData([...chain, ...secondChain])
        return res.status(200).json(data)
    }
    catch (ex) {
        console.log(ex);
        res.status(500).json({ message: "Internal Server Error" });
    }
}








/**
 * Get the provided record's chain.
 */
const getChain = async (record: Contact) => {
    let chain: Contact[] = [];

    // if the provided record is "primary" then it is starting of the chain hence move towards the end of the chain to get all records. 
    if (record.linkPrecedence === "primary") {
        chain = await contactService.traverseForward(record.id);
        chain.unshift(record);
    }
    else {
        if (record.linkedId === null) throw Error(`record with id ${record.id} is secondary and has null as linkedId`)

        // if provided record is not "primary" then move towards the start of the chain to get all records till "primary". 
        chain = await contactService.traverseBackward(record.linkedId);

        // above traversal does not include the provided record
        chain.push(record);

        // move towards the end to get all the records till end of the chain.
        const remainingRecords = await contactService.traverseForward(record.id);
        chain.push(...remainingRecords);
    }

    return chain;
}




interface TrueResult {
    status: true
}

interface FalseResult {
    status: false
    // record whose id is least among records which donot belong to first chain
    leastUncommonRecord: Contact
}



/**
 * Checks if all the matching records belong to a single chain
 * 
 * @param matchingRecords records whose email or phoneNumber are same as in request body
 * @param chain array of a person's contacts
 * @returns status - indicates whether matchingRecords belong to a single chain
 * 
 * leastUncommonRecord - if matchingRecords are not from a single chain then the record whose id is least and not in the first chain is returned
 */
const checkIfSingleChain = (matchingRecords: Contact[], chain: Contact[]): TrueResult | FalseResult => {

    // record which is not part of the chain and has least id.
    let leastUnCommonRecord: Contact | null = null;

    // check if all the matching records belong to the provided chain.
    matchingRecords.every(m => {
        if (chain.some(c => c.id === m.id) === false) {
            leastUnCommonRecord = m;
            return false
        }
        return true
    })


    if (leastUnCommonRecord === null) {
        return { status: true }
    }

    return { status: false, leastUncommonRecord: leastUnCommonRecord }
}





/**
 * Check if email or phoneNumber provided in the request body are not present in the chain.
 * 
 * @param email email from request body
 * @param phoneNumber phoneNumber from request body
 * @param chain person's contacts
 */
const checkEmailOrPhoneNumberAreNew = (email: string | null = null, phoneNumber: string | null = null, chain: Contact[]) => {
    let isEmailNew = email !== null ? true : false;
    let isPhoneNumberNew = phoneNumber !== null ? true : false;

    for (let record of chain) {
        if (record.email === email) isEmailNew = false;
        if (record.phoneNumber === phoneNumber) isPhoneNumberNew = false;

        if (isEmailNew === false && isPhoneNumberNew === false) break;
    }

    return isEmailNew || isPhoneNumberNew;
}





/**
 * format chain data according to response requirement
 */
const formatData = (chain: Contact[]) => {

    let emails = new Set();
    let phoneNumbers = new Set();
    let secondaryContactIds = new Set();

    chain.forEach(record => {
        if (record.email) emails.add(record.email)
        if (record.phoneNumber) phoneNumbers.add(record.phoneNumber)
        if (record.linkPrecedence !== "primary") secondaryContactIds.add(record.id)
    })


    return {
        contact: {
            primaryContatctId: chain[0].id,
            emails: Array.from(emails),
            phoneNumbers: Array.from(phoneNumbers),
            secondaryContactIds: Array.from(secondaryContactIds)
        }
    }
}