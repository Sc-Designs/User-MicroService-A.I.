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

app.get("/",(req, res)=>{
  res.send("Helth Check");
});
app.use("/api", userRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
