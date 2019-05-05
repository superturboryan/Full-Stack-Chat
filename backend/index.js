let express = require("express")
let cors = require("cors")
let multer = require("multer")
let upload = multer()
let app = express()
let cookieParser = require('cookie-parser')
const MongoClient = require("mongodb").MongoClient;

app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://0.0.0.0:3000/" }))
// app.use(cors({ credentials: true, origin: "http://134.209.119.133:3000" }))

let url = "mongodb+srv://admin:Ryanu1123@cluster0-nswep.mongodb.net/test?retryWrites=true"

let chatDB
let messagesCollection

MongoClient.connect(url, (err, allDbs) => {
   if (err) throw err;
   chatDB = allDbs.db("Chat-DB")
   messagesCollection = chatDB.collection("Messages")
})

let passwords = {}
let sessions = {}
let messages = []

app.get("/signout", function (req, res) {
   console.log("Deleting cookie from sessions object:", req.cookies.sid)
   delete sessions[req.cookies.sid]
   res.send(JSON.stringify({ success: false }))
})

app.get("/check-logged-in-status", function (req, res) {

   console.log("This is the current cookie", req.cookies.sid ? req.cookies.sid : "NO COOKIE")
   //Check if cookie being sent is part of sessions object
   if (sessions[req.cookies.sid] !== undefined) {
      res.send(JSON.stringify({ success: true, user: sessions[req.cookies.sid] }))
      return
   }
   res.send(JSON.stringify({ success: false }))
})

app.get("/messages", function (req, res) {

   let sessionId = req.cookies.sid

   if (sessions[sessionId] === undefined) {
      res.send(JSON.stringify("Intruder detected - ACCESS DENIED!"))
   }
   //Get only the last twenty messages
   let response = messages.slice(-20)

   res.send(JSON.stringify(response))
})

app.get("/delete-messages", function (req, res) {

   let sessionId = req.cookies.sid
   let currentUsername = sessions[sessionId]
   messages = messages.filter(message => {
      return message.username !== currentUsername
   })

   res.send(JSON.stringify({ success: true }))
})

app.post("/newmessage", upload.none(), (req, res) => {
   console.log("*** inside new message") /
      console.log("body", req.body)
   let sessionId = req.cookies.sid
   let username = sessions[sessionId]
   console.log("username", username)
   let msg = req.body.msg
   let timeStamp = req.body.timeStamp

   //Check is message type is login or not
   if (req.body.type === "login") {
      let newMsg = { message: msg, timeStamp: timeStamp, username: "SYSTEM" }
      messages = messages.concat(newMsg)
      res.send(JSON.stringify({ success: true }))
      return
   }
   let newMsg = { username: username, message: msg, timeStamp: timeStamp }
   console.log("new message", newMsg)
   messages = messages.concat(newMsg)
   console.log("updated messages", messages)

   messagesCollection.insertOne(newMsg, (err, results) => {
      if (err) throw err;
      console.log("Successfully inserted messages into collection in remote database!")
   })

   res.send(JSON.stringify({ success: true }))
})

app.post("/login", upload.none(), (req, res) => {
   console.log("**** I'm in the login endpoint")
   console.log("this is the parsed body", req.body)
   let username = req.body.username
   let enteredPassword = req.body.password
   let expectedPassword = passwords[username]
   console.log("expected password", expectedPassword)
   if (enteredPassword === expectedPassword) {
      console.log("password matches")
      let sessionId = generateId()
      console.log("generated id", sessionId)
      sessions[sessionId] = username
      res.cookie('sid', sessionId);
      res.send(JSON.stringify({ success: true }))
      return
   }
   res.send(JSON.stringify({ success: false }))
})

app.post("/signup", upload.none(), (req, res) => {
   console.log("**** I'm in the signup endpoint")
   console.log("this is the body", req.body)
   let username = req.body.username
   let enteredPassword = req.body.password
   console.log()
   if (passwords[username] !== undefined) {
      console.log("Username already taken!")
      res.send(JSON.stringify({ success: false }))
      return
   }
   console.log("passwords object", passwords)
   passwords[username] = enteredPassword
   res.send(JSON.stringify({ success: true }))
})


// app.listen(4000, "0.0.0.0", () => {
//    console.log("Running on port 4000 , 0.0.0.0")
// })

app.listen(4000, () => {
   console.log("Running on port 4000")
})

let generateId = () => {
   return "" + Math.floor(Math.random() * 100000000)
}
