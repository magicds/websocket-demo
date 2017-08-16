let ws = require("nodejs-websocket")

let PORT = 8001

let user = 0
let count = 0
// Scream server example: "hi" -> "HI!!!" 
let server = ws.createServer(function (conn) {
  console.log("New connection")
  count++;
  user++;
  conn.userName = 'user' + user;

  broadcastMsg(wrapMessage('enter', conn.userName + ' enter!'));
  broadcastMsg(wrapMessage('countUpdate', count));

  conn.on("text", function (str) {
    console.log("Received " + str)
    // conn.sendText(str.toUpperCase() + "!!!")
    broadcastMsg(wrapMessage('message', conn.userName + ':' + str))
  })

  conn.on("close", function (code, reason) {
    console.log("Connection closed")
    count--;
    broadcastMsg(wrapMessage('left', conn.userName + ' left!'))
    broadcastMsg(wrapMessage('countUpdate', count))
  })
  conn.on("error", function (err) {
    console.log(err);
  })
}).listen(PORT);

console.log('node-websocket is running at port:' + PORT)

// 包装消息
function wrapMessage(type, data) {
  return JSON.stringify({
    type,
    data
  })
}

// 广播
function broadcastMsg(msg) {
  server.connections.forEach(function (conn) {
    conn.sendText(msg)
  });
}