# 使用 socket.io 模拟 websocket 连接管理

使用 `socket.io` 模拟 websocket 连接管理，使用管理端可像每个测试端推送消息，或者集体广播消息。

1. 进入 demo4 目录 输入`node app.js` 启动 socket.io
1. 在浏览器中访问`localhost: + '显示的端口号，默认为8001'` 充当连接客户端。
1. 在浏览器中访问`localhost: + '显示的端口号，默认为8001'/admin` 充当连接 socket 管理端。
