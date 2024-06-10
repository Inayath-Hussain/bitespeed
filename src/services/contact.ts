import { prisma } from "../config/db";

class ContactService {


    /**
     * traverse forwards (from primary to end of the chain)
     * @param id Id of the record
     * @returns array of all the connected records excluding the primary record.
     */
    async traverseForward(id: number) {
        const records = [];
        let currentId: number = id;

        while (currentId !== -1) {

            // find the next linked record by comparing current record's id with linkedId of others.
            const record = await prisma.contact.findFirst({
                where: { linkedId: currentId }
            })

            if (record) {
                records.push(record);
                currentId = record.id;
            }
            else {
                currentId = -1
            }
        }


        return records;
    }


    /**
     * traverse backwards(from the end of the chain to primary)
     * @param linkedId linkedId of the current record
     * @returns array of all the connected records excluding the record whose linkedId is provided.
     */
    async traverseBackward(linkedId: number) {
        const records = [];
        let currentId: number = linkedId;

        while (currentId !== -1) {

            // find the next linked record by comparing current record's linkedId with id of others.
            const record = await prisma.contact.findFirst({
                where: { id: currentId }
            });

            if (record) {
                records.unshift(record);
                currentId = record.linkedId === null ? -1 : record.linkedId;
            }
            else {
                currentId = -1
            }
        }


        return records;
    }



    async getMatchingContacts(email: string | null = null, phoneNumber: string | null = null) {
        const matchingRecords = await prisma.contact.findMany({
            orderBy: { id: "asc" },
            where: { OR: [{ email }, { phoneNumber }] }
        })

        return matchingRecords;
    }



    async createContact(email: string | null = null, phoneNumber: string | null = null, linkedId: number | null = null) {
        return await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: linkedId === null ? "primary" : "secondary",
                linkedId
            }
        })
    }




    /**
     * link a record with another
     * @param targetId id of the record to which another record will point to
     * @param sourceId id of the record whose linkedId will be updated
     */
    async linkContacts(targetId: number, sourceId: number) {
        return await prisma.contact.update({
            where: { id: sourceId },
            data: { linkedId: targetId, linkPrecedence: "secondary" }
        })
    }
}


export const contactService = new ContactService();








// each chain represents a person
// for a request it can only be added to chain if any one record in chain has same email or phoneNumber or both
// 3 possibilites
// 1. no record with common email or phoneNumber - create new record
// 2. match with one chain - traverse linked list and append at last(if contains new data).
// 3. match with two different chains - chain whose primary has highest id merged with chain with lowest id


// possibility 1
// query with email or phoneNumber - result.length == 0, create new record
// return formatted data


// possibility 2
// make sure it is only one chain and get that chain's last record
// check if primary exists in result
//           loop through chain and check if all ids in result exist in chain, if this check fails then move to possibility 3.
// else get the record with least id and traverse to get the primary record. then repeat above looping step
// if there is only one chain check if either email or phoneNumber is not present in chain
//      true - create new record and append at last.
// return formatted data



// possibility 3
// get the record with least id and travse to get the primary record.
// now loop through the chain and filter out all the records from the result which are not present in this chain.
// now with the filtered result repeat first step
// after getting the second primary record compare ids of both primary records and merge the greater one with last record of chain whose primary was least
// return formatted data