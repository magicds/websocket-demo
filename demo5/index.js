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
    this.ws.send(
      JSON.stringify({
        type: "enter",
        roomId: this.roomId,
        name: this.username,
      })
    );
    this.login = true;
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
  },
  onMessage(ev) {
    const data = ev.data;
    console.log("🚀 ~ onMessage ~ onMessage", ev);
    try {
      const message = JSON.parse(data);
      // if (message.message) {
      //   message.message = message.message.replace(/\n/g, "<br>");
      // }
      if (message.type === 'noAuth') {
        // 鉴权失败 todo
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
  },
  onError() {
    console.log("🚀 ~ onError ~ onError");
  },
  mounted() {
    window.ws = this.ws = new WebSocket("ws://127.0.0.1:8080");
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
  },
}).mount("#app");
