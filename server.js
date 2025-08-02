import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectWithRetry from "./db/mongoose-connection.js";

const server = http.createServer(app);
connectWithRetry();

  server.listen(3001, () => {
    console.log("User Service runing on Port 3001");
  });