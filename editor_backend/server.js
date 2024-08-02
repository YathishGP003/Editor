const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const app = express();
const cors = require("cors");
const Axios = require("axios");
const server = http.createServer(app);
const io = new Server(server);
const qs = require("qs");
const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");
app.use(cors());
// app.use(cors({
//   origin: "*",
//   methods: "*",
//   credentials: true
// }));
app.use(express.json());
const userSocketMap = {};
// const URI = "mongodb://127.0.0.1:27017/Editor";
const URI = `mongodb+srv://harsh:${process.env.DB_CONNECT}@codeeditor.olio7bd.mongodb.net/?retryWrites=true&w=majority&appName=CodeEditor`;

app.post("/compile", (req, res) => {
  let code = req.body.code;
  let language = req.body.language;
  let input = req.body.input;
  if (language === "python") {
    language = "python3";
  }
  console.log(process.env);
  // var data = qs.stringify({
  //     'code': code,
  //     'language': language,
  //     'input': input
  // });
  const options = {
    method: "POST",
    url: "https://online-code-compiler.p.rapidapi.com/v1/",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": `${process.env.REACT_APP_COMPILE_RAPID_API_KEY}`,
      "X-RapidAPI-Host": "online-code-compiler.p.rapidapi.com",
    },
    data: {
      language: language,
      version: "latest",
      code: code,
      input: input,
    },
  };
  Axios(options)
    .then(function (response) {
      res.send(response.data.output);
    })
    .catch(function (error) {
      console.log(error);
    });
});

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}
io.on("connection", (socket) => {
  console.log("socket id", socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {
      code,
    });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, {
      code,
    });
  });

  socket.on(ACTIONS.REMOVE, ({ roomId, email }) => {
    socket.to(roomId).emit(ACTIONS.REMOVED, {
      email,
    });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: String,
    required: true,
  },
  members: {
    type: Array,
  },
});

const room = mongoose.model("room", roomSchema);

mongoose
  .connect(URI)
  .then((response) => console.log("Mongodb Connected"))
  .catch((err) => console.log(err));

app.post("/room", async (req, res) => {
  try {
    const result = await room.create({
      roomId: req.body.roomId,
      owner: req.body.owner,
    });
  } catch (err) {
    console.log(err);
  }
  return res.status(201).json({ msg: "success" });
});

app.get("/room/:id", async (req, res) => {
  let result = null;
  try {
    result = await room.find({ roomId: req.params.id });
  } catch (err) {
    console.log(err);
  }
  return res.status(200).send(result);
});

app.put("/room/add/:id", async (req, res) => {
  try {
    const result = await room.find({ roomId: req.params.id });
    let members = result[0].members;
    if (!members.includes(req.body.member)) {
      members.push(req.body.member);
      const result2 = await room.updateOne(
        { roomId: req.params.id },
        { $set: { members: members } }
      );
    }
  } catch (err) {
    console.log(err);
  }
  return res.status(200).json({ msg: "updated" });
});

app.put("/room/remove/:id", async (req, res) => {
  try {
    const result = await room.find({ roomId: req.params.id });
    let members = result[0].members;
    members = members.filter((member) => member != req.body.member);
    const result2 = await room.updateOne(
      { roomId: req.params.id },
      { $set: { members: members } }
    );
  } catch (err) {
    console.log(err);
  }
  return res.status(200).json({ msg: "updated" });
});


// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "editor_ui/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "editor_ui", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is listening at ${PORT}`));