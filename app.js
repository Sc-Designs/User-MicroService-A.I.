import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.router.js";
import cors from "cors";
import logger from "morgan";


const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors({ origin: "http://localhost:5173" }));

app.use("/", userRoute);


export default app;
