//Change webpack.config host back to 0.0.0.0 before pushing so it can be run from droplet !

let express = require("express")
let cors = require("cors")
let multer = require("multer")
let upload = multer()
let app = express()
let cookieParser = require('cookie-parser')
const MongoClient = require("mongodb").MongoClient;

app.use(cookieParser());
//Config for local cors
app.use(cors({ credentials: true, origin: "http://localhost:3000" }))
//Config for remote server cors
// app.use(cors({ credentials: true, origin: "http://134.209.119.133:3000" }))

let url = "mongodb+srv://admin:Ryanu1123@cluster0-nswep.mongodb.net/test?retryWrites=true"

//Database variables 
let chatDB
let messagesCollection
let passwordsCollection
let sessionsCollection

MongoClient.connect(url, (err, allDbs) => {
   if (err) throw err;
   chatDB = allDbs.db("Chat-DB")
   messagesCollection = chatDB.collection("Messages")
   passwordsCollection = chatDB.collection("Passwords")
   sessionsCollection = chatDB.collection("Sessions")
})

let passwords = {}
let sessions = {}
let messages = []

app.get("/signout", function (req, res) {
   //Remove sessionID from local sessions object
   console.log("Deleting cookie from sessions object:", req.cookies.sid)
   delete sessions[req.cookies.sid]
   //Remove entry from sessions collection in db
   sessionsCollection.remove({ sessionId: req.cookies.sid }, (err, result) => {
      if (err) throw err;
      console.log("Successfully removed entry from sessions collection!")
   })
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

   messagesCollection.find({}).toArray((err, result) => {
      if (err) throw err;
      // console.log("Messages from db: ", result)
      res.send(JSON.stringify(result.slice(-20)))
   })

   //GET MESSAGES FROM LOCAL SERVER MESSAGES OBJECT
   //Get only the last twenty messages
   // let response = messages.slice(-20)
   // res.send(JSON.stringify(response))
})

app.get("/delete-messages", function (req, res) {

   let sessionId = req.cookies.sid
   let currentUsername = sessions[sessionId]
   messages = messages.filter(message => {
      return message.username !== currentUsername
   })

   res.send(JSON.stringify({ success: true }))
})

app.get("/clear-all-messages", function (req, res) {

   messagesCollection.remove({}, (err, result) => {
      if (err) throw err;
      console.log("Removing all messages from messages collection on remote database!")
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
   //Check is message type is login or not, make username SYSTEM
   if (req.body.type === "login") {
      let newMsg = { message: msg, timeStamp: timeStamp, username: "SYSTEM" }
      messages = messages.concat(newMsg)
      //Insert into DB!
      messagesCollection.insertOne(newMsg, (err, result) => {
         if (err) throw err;
         console.log("Successfully inserted messages into collection in remote database!")
      })
      res.send(JSON.stringify({ success: true }))
      return
   }
   //If not then username is taken from sessions object!
   let newMsg = { username: username, message: msg, timeStamp: timeStamp }
   console.log("new message", newMsg)
   messages = messages.concat(newMsg)
   console.log("updated messages", messages)
   //Insert into DB!
   messagesCollection.insertOne(newMsg, (err, result) => {
      if (err) throw err;
      console.log("Successfully inserted messages into collection in remote database!")
   })

   res.send(JSON.stringify({ success: true }))
})

app.post("/login", upload.none(), (req, res) => {
   let username = req.body.username
   let enteredPassword = req.body.password
   let expectedPassword = passwords[username]
   console.log("expected password", expectedPassword)
   if (enteredPassword === expectedPassword) {
      console.log("password matches")
      let sessionId = generateId()
      console.log("generated id", sessionId)
      //Add to local sessions object
      sessions[sessionId] = username
      //Add to remote sessions collection
      sessionsCollection.insertOne({ sessionId: sessionId, username: username }, (err, result) => {
         if (err) throw err;
         console.log("Successfully inserted sessionID and username into remote database!")
      })
      res.cookie('sid', sessionId);
      res.send(JSON.stringify({ success: true }))
      return
   }
   res.send(JSON.stringify({ success: false }))
})

app.post("/signup", upload.none(), (req, res) => {
   let username = req.body.username
   let enteredPassword = req.body.password
   if (passwords[username] !== undefined) {
      console.log("Username already taken!")
      res.send(JSON.stringify({ success: false }))
      return
   }
   //ADD VALUE TO LOCAL PASSWORDS OBJECT
   // passwords[username] = enteredPassword

   //ADD ENTRY TO PASSWORDS COLLECTION IN REMOTE DB
   passwordsCollection.insert({ username: username, password: enteredPassword }, (err, result) => {
      if (err) throw err;
      console.log("Successfully added entry to passwords collection in remote database!")
   })
   res.send(JSON.stringify({ success: true }))
})

//USE WITH REMOTE SERVER! 
// app.listen(4000, "0.0.0.0", () => {
//    console.log("Running on port 4000 , 0.0.0.0")
// })

app.listen(4000, () => {
   console.log("Running on port 4000")
})

let generateId = () => {
   return "" + Math.floor(Math.random() * 100000000)
}
