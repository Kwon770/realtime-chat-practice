// use require() from NodeJs
const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Server Socket
io.on("connect", (socket) => {
  // Socket Listenr
  // (LISTENER KEYWORD, DATA, DATA, ...)
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    // Generate greeting message
    // message: admin message
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to the room ${user.room}`,
    });
    // Send to all the other socket
    socket.broadcast
      // Set target
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined !` });

    socket.join(user.room);
  });

  // sendMessage: user message
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left`,
      });
    }
  });
});

app.use(router);

// (PORT, CALLBACK)
server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
