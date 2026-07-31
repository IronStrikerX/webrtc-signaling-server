const WebSocket = require("ws");
const server = new WebSocket.Server({ port: process.env.PORT || 3000 });

let rooms = {};

server.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    const room = data.room;

    if (data.type === "host") {
      rooms[room] = { host: ws, client: null };
      ws.peerId = 1;
      ws.room = room;
      ws.send(
        JSON.stringify({ type: "hosted", message: `Room ${room} created.` }),
      );
    } else if (data.type === "join") {
      if (rooms[room] && !rooms[room].client) {
        rooms[room].client = ws;
        ws.peerId = 2;
        ws.room = room;
        ws.send(JSON.stringify({ type: "joined", id: 2 }));
        rooms[room].host.send(
          JSON.stringify({ type: "peer_connected", id: 2 }),
        );
      } else {
        ws.send(
          JSON.stringify({ type: "error", message: "Room full or missing." }),
        );
      }
    } else if (data.type === "signal") {
      if (rooms[room]) {
        const targetWs =
          ws.peerId === 1 ? rooms[room].client : rooms[room].host;
        if (targetWs) {
          targetWs.send(
            JSON.stringify({
              type: "signal",
              id: ws.peerId,
              payload: data.payload,
            }),
          );
        }
      }
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      delete rooms[ws.room];
    }
  });
});
console.log("Signaling server running.");
