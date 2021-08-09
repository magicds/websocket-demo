const urlParams = new URLSearchParams(location.search);

PetiteVue.createApp({
  login: false,
  roomId: urlParams.get("roomId") || "",
  username: urlParams.get("username") || "",
  message: "",
  num: 0,
  list: [],

  enter() {
    if (!this.username || !this.roomId) return;
    if (!this.ws) {
      this.init();
    }
  },
  send() {
    if (this.ws.readyState !== WebSocket.OPEN) {
      alert("链接已断开");
      return;
    }
    this.ws.send(
      JSON.stringify({
        type: "message",
        message: this.message,
      })
    );
    this.message = "";
  },
  exit() {
    if (ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      this.login = false;
    }
  },

  onOpen() {
    console.log("🚀 ~ onOpen ~ onOpen");
    // 鉴权请求
    // https://jwt.io/
    // {"name": "wesocket-demo","iat": 1516239022}
    this.ws.send(
      JSON.stringify({
        type: "auth",
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoid2Vzb2NrZXQtZGVtbyIsImlhdCI6MTUxNjIzOTAyMn0.sn6xi6uv4lJeAWWzojENNXktBg1XiXL2IqeC9_FyNXg",
      })
    );
    // 进入时才建立连接 因此 enter 要在open的时候再发送
    this.ws.send(
      JSON.stringify({
        type: "enter",
        roomId: this.roomId,
        name: this.username,
      })
    );
    this.login = true;
  },
  onMessage(ev) {
    const data = ev.data;
    console.log("🚀 ~ onMessage ~ onMessage", ev);
    try {
      const message = JSON.parse(data);
      // if (message.message) {
      //   message.message = message.message.replace(/\n/g, "<br>");
      // }
      if (message.type === "noAuth") {
        // 鉴权失败 todo
        return;
      }
      if (message.type === "heartbeat") {
        this.checkServerStatus();
        this.ws.send(
          JSON.stringify({
            type: "heartbeat",
            message: "pong",
          })
        );
        return;
      }
      if (message.subType === "onlineCount") {
        this.num = message.num;
      }

      this.list.push(message);
      this.$nextTick(() => {
        var list = this.$refs["list"];
        list &&
          list.lastElementChild &&
          list.lastElementChild.scrollIntoViewIfNeeded();
      });
    } catch (error) {
      console.error(error);
    }
  },
  onClose() {
    console.log("🚀 ~ onClose ~ onClose");
    this.ws.close();
  },
  onError() {
    console.log("🚀 ~ onError ~ onError");
    // 1s 后自动重连
    setTimeout(() => {
      console.log("自动重连");
      this.init();
    }, 1000);
  },
  init() {
    window.ws = this.ws = new WebSocket("ws://127.0.0.1:8080");
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
  },
  checkServerStatus() {
    const SERVER_HEARTBEAT_TIME = 3000;
    const NETWORK_DELAY = 500;
    clearTimeout(this.checkerServerTimer);
    this.checkerServerTimer = setTimeout(() => {
      console.log('心跳检测失败');
      // 超时 则关闭并建立新的连接
      this.onClose();
      setTimeout(() => {
        console.log('心跳检测失败 后重连');
        this.init();
      }, 1000);
    }, SERVER_HEARTBEAT_TIME + NETWORK_DELAY);
    // 轮询时间 + 最大允许迟延时间
    // 正常情况下 肯定会收到下次轮询 定时器被清除 关闭重连不会进行
    // 当再加上最大允许的延迟时间 还没有下一次服务端的的轮询 则表示怪掉了 关掉重连
  },
  mounted() {},
}).mount("#app");
