import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.router.js";
import cors from "cors";
import logger from "morgan";
import {
  connect,
  subscribeToQueue,
  publishToQueue,
} from "./services/rabbit.service.js";
import { setupRpcResponseHandler } from "./utils/rpcClient.js";

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors({ origin: "http://localhost:5173" }));

app.use("/", userRoute);

(async () => {
  await connect();
  setupRpcResponseHandler(subscribeToQueue);
  console.log("👷 User microservice RPC response handler active...");
})();

export default app;
