import { PrismaClient } from "@prisma/client";


export const prismaClient = new PrismaClient({
    log: ["query"]
})



/**
 * tries to create connection with db
 */
export const connectToDb = async () =>
    new Promise(resolve => {
        prismaClient.$connect()
            .then(() => {
                console.log("Connected to db")
                resolve(true);
            })
            .catch((err) => {
                console.log(err)
                process.exit(1);
            })
    })