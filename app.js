import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.router.js";
import cors from "cors";
import logger from "morgan";
import connectWithRetry from "./db/mongoose-connection.js";

const app = express();

connectWithRetry();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors());

userRoute.stack.forEach((layer) => {
  if (layer.route) {
    console.log(
      Object.keys(layer.route.methods).join(", ").toUpperCase(),
      layer.route.path
    );
  }
});


app.use("/", userRoute);

app.listen(3001, () => {
   console.log("User Service runing on Port 3001");
 });
