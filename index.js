import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
});

server.listen(process.env.PORT ?? 3001, () => {
  console.log("server running at http://localhost:3000");
});
