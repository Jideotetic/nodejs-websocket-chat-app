import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
  filename: "chat.db",
  driver: sqlite3.Database,
});

await db.exec(`DELETE FROM messages`);

await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_offset TEXT UNIQUE,
          content TEXT
      );
    `);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

app.use(express.static("public"));

io.on("connection", async (socket) => {
  socket.on("chat message", async (msg, clientOffset, callback) => {
    let result;
    try {
      result = await db.run(
        "INSERT INTO messages (content, client_offset) VALUES (?, ?)",
        msg,
        clientOffset
      );
    } catch (e) {
      if (e.errno === 19) {
        // callback();
      } else {
        // do nothing
      }
      return;
    }
    io.emit("chat message", msg, result.lastID);
    // callback();
  });

  if (!socket.recovered) {
    try {
      await db.each(
        "SELECT id, content FROM messages WHERE id > ?",
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit("chat message", row.content, row.id);
        }
      );
    } catch (e) {
      console.error(e);
    }
  }
});

server.listen(process.env.PORT ?? 3001, () => {
  console.log("server running at http://localhost:3000");
});
