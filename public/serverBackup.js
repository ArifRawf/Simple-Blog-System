const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  const filePath = "./public" + (req.url === "/" ? "/index.html" : req.url);

  fs.readFile(filePath, (err, data) => {
    if (err) return res.end("Not found");
    res.writeHead(200);
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

const users = {};
const activeCalls = {}; 

function send(to, data) {
  const mysocket = users[to];
  if (mysocket && mysocket.readyState === WebSocket.OPEN) {
    mysocket.send(JSON.stringify(data));
  }
}

function broadcast() {
  const list = Object.keys(users);
  list.forEach(id => send(id, { type: "users", users: list }));
}

wss.on("connection", (ws) => {

  ws.on("message", (msg) => {
    const d = JSON.parse(msg);

    if (d.type === "login") {
      ws.userId = d.userId;
      users[d.userId] = ws;
      broadcast();
    }

    // 🔥 BLOCK if already in call
    if (d.type === "call") {
      if (activeCalls[d.from] || activeCalls[d.to]) return;

      send(d.to, { type: "incoming_call", from: d.from });
    }

    if (d.type === "offer") {
      send(d.to, { type: "offer", offer: d.offer, from: d.from });
    }

    if (d.type === "answer") {
      activeCalls[d.from] = d.to;
      activeCalls[d.to] = d.from;

      send(d.to, { type: "answer", answer: d.answer, from: d.from });
    }

    if (d.type === "ice") {
      send(d.to, { type: "ice", ice: d.ice, from: d.from });
    }

    // 🔥 NEW: HANGUP
    if (d.type === "hangup") {
      delete activeCalls[d.from];
      delete activeCalls[d.to];

      send(d.to, { type: "hangup", from: d.from });
    }
  });

  ws.on("close", () => {
    if (ws.userId) {
      delete users[ws.userId];
      delete activeCalls[ws.userId];
    }
    broadcast();
  });
});

server.listen(3000);