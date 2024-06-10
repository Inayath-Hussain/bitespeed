import express from "express";
import morgan from "morgan";
import { mainRouter } from "./routes/identify";


export const app = express();

// middleware
app.use(morgan("dev"));
app.use(express.json())


// routes
app.use("/identify", mainRouter)