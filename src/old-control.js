// const { Socket } = require('phoenix-channels')
//
// // let socket = new Socket("ws://localhost:4000/socket")
// let socket = new Socket("https://robust-querulous-cassowary.gigalixirapp.com/socket")
//
// socket.connect()
//
// // Now that you are connected, you can join channels with a topic:
// let channel = socket.channel("control:orange-apple-123", {foo: 'bar'})
// channel.join()
//   .receive("ok", resp => { console.log("Joined successfully", resp) })
//   .receive("error", resp => { console.log("Unable to join", resp) })
//
//
// setInterval(() => {
//   console.log("Pushing new_msg...")
//   channel.push("new_msg", {body: 'Hello'})
// }, 3000)
//
// channel.on("reply_msg", payload => {
//   console.log(payload)
// })
