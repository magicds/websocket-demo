// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8001;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

const testNamespace = io.of('/test');

testNamespace.on('connection', (socket) => {
    console.log(`${socket.id}  connected`);
    // 新连接广播给所有用户 自身除外
    // socket.broadcast.emit('newcontent', 'all');

    // 新客户端连接时 给所有管理端同步消息
    adminNamespace.emit('newcontent', Object.keys(testNamespace.sockets));


    socket.use((packet, next) => {
        console.log(packet);
        socket.emit('server.receive', `已经收到${packet["0"]} : ${packet["1"]}`);
        next();
    });

});

const adminNamespace = io.of('/admin');

adminNamespace.on('connect', (socket) => {

    // 连接成功自动推送 所有连接id过去
    socket.emit('newcontent', Object.keys(testNamespace.sockets));
    socket.on('disconnect', function () {
        console.log(`${socket.id}  disconnected`);
    });

    // socket.use((packet, next) => {
    //     console.log(packet);
    //     socket.emit('server.receive', `已经收到${packet["0"]} : ${packet["1"]}`);
    //     let socketId = '';
    //     testNamespace.sockets[socketId].emit(packet["0"], packet["1"]);
    //     next();
    // });

    socket.on('sendMessage', (data) => {
        let {
            id,
            message
        } = data;
        testNamespace.sockets[id].emit(message.type, message.content);
    });

    socket.on('broadcast', (data) => {
        testNamespace.emit(data.type, data.content)
    });

});