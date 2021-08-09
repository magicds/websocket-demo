const WebSocket = require("ws");
const http = require("http");
const jwt = require("jsonwebtoken");

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", function upgrade(request, socket, head) {
  // This function is not defined on purpose. Implement it with your own logic.
  // authenticate(request, (err, client) => {
  //   if (err || !client) {
  //     socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
  //     socket.destroy();
  //     return;
  //   }

  // console.log(request.headers);

  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit("connection", ws, request);
  });
  // });
});

let numMap = {};
wss.on("connection", function connection(ws) {
  ws.isAlive = true;
  console.log("client connection");
  ws.on("message", function incoming(message) {
    const obj = JSON.parse(message);
    if (obj.type === "auth") {
      jwt.verify(obj.token, "secret", (err, res) => {
        if (err) {
          console.log("auth error");
          console.error(err);
          ws.isAuth = false;
        } else if (res.name === "wesocket-demo") {
          // 鉴权通过 在实例上标记
          console.log("鉴权通过", res);
          ws.isAuth = true;
        } else {
          ws.isAuth = false;
        }
        if (!ws.isAuth) {
          ws.send(
            JSON.stringify({
              type: "noAuth",
              message: "you need auth to use",
            })
          );
        }
      });
      return;
    }
    if (!ws.isAuth) {
      return;
    }
    if (obj.type === "heartbeat" && obj.message === "pong") {
      ws.isAlive = true;
      return;
    }
    if (obj.type === "enter") {
      // 在实例上记录用户和房间
      ws.username = obj.name;
      ws.roomId = obj.roomId;
      if (numMap[ws.roomId] == undefined) {
        numMap[ws.roomId] = 0;
      }
      numMap[ws.roomId]++;
      broadcast(
        {
          type: "system",
          message: `${obj.name}进入聊天室`,
          date: new Date().toISOString(),
        },
        ws
      );
      broadcast(
        {
          type: "system",
          subType: "onlineCount",
          num: numMap[ws.roomId],
          message: "在线人数" + numMap[ws.roomId],
        },
        ws
      );
    } else if (obj.type === "message") {
      broadcast(
        {
          type: "message",
          message: obj.message,
          date: new Date().toISOString(),
          sender: ws.username,
        },
        ws
      );
    }
  });

  ws.on("close", function () {
    console.log("🚀 ~ close", ws.username);

    if (ws.username) {
      numMap[ws.roomId]--;
      broadcast(
        {
          type: "system",
          message: `${ws.username}退出了聊天室`,
          date: new Date().toISOString(),
        },
        ws
      );
      broadcast(
        {
          type: "system",
          subType: "onlineCount",
          num: numMap[ws.roomId],
          message: "在线人数" + numMap[ws.roomId],
        },
        ws
      );
    }
  });

  // ws.send("something");
});

server.listen(8080);

/**
 * 广播消息
 * @param {Object} obj 发送的消息
 * @param {WebSocket} client 来自的客户端
 */
function broadcast(obj, client) {
  wss.clients.forEach((ws) => {
    if (ws.username && ws.roomId === client.roomId) {
      ws.send(JSON.stringify(obj));
    }
  });
}

/**
 * 鉴权方式 受限于浏览器ws只能传 url 因此可以
 * 1. url 传参
 * 2. websocket 连接之后 message 鉴权
 * 3. upgrade 时 使用cookie session
 *
 * 当客户端不是浏览器时 可以直接 ws header 传参
 */

// 心跳检测

const heartbeatTime = 3000; // 间隔时间
const NETWORK_DELAY = 500; // 最大迟延时间

setInterval(() => {
  wss.clients.forEach((ws) => {
    // 自定义的状态属性
    if (!ws.isAlive && ws.roomId) {
      numMap[ws.roomId]--;
      delete ws.roomId;
      // 失败的情况下 服务端主动断开 可导致客户端的心跳检测失败 触发重连
      ws.terminate();
    }

    ws.isAlive = false;
    ws.send(
      JSON.stringify({
        type: "heartbeat",
        message: "ping",
      })
    );
  });
}, heartbeatTime);
