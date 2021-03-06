//*************************************************************************************** */
//Change webpack.config host back to 0.0.0.0 before pushing so it can be run from droplet ! 
//*************************************************************************************** */

let express = require("express")
let cors = require("cors")
let multer = require("multer")
let upload = multer()
let app = express()
let cookieParser = require('cookie-parser')
const MongoClient = require("mongodb").MongoClient;

const http = require("http").createServer(app);
const io = require("socket.io")(http);


app.use(cookieParser());

//Config for local cors
app.use(cors({ credentials: true, origin: "http://localhost:3000" }))
//Config for remote server cors
// app.use(cors({ credentials: true, origin: "http://134.209.119.133:3000" }))

let url = "mongodb+srv://admin:12345@cluster0-nswep.mongodb.net/test?retryWrites=true"

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/signout", function (req, res) {

   //Remove entry from sessions collection in db
   sessionsCollection.deleteOne({ sessionId: req.cookies.sid }, (err, result) => {
      if (err) throw err;
      console.log("DB: Successfully removed entry from sessions collection!")
   })
   res.send(JSON.stringify({ success: false }))
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/check-logged-in-status", function (req, res) {

   console.log("This is the current cookie", req.cookies.sid ? req.cookies.sid : "NO COOKIE")
   //CHECK IN DATABASE IF SESSION ID EXISTS
   sessionsCollection.find({ sessionId: req.cookies.sid }).toArray((err, result) => {
      if (result[0] !== undefined) {
         console.log("AUTO LOGIN!")
         res.send(JSON.stringify({ success: true, user: result[0].username }))
         return
      }
      else {
         res.send(JSON.stringify({ success: false }))
      }
   })
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/messages", function (req, res) {

   let sessionId = req.cookies.sid

   //CHECK SESSIONS COLLECTION TO SEE IF SESSION ID EXISTS
   sessionsCollection.find({ sessionId: sessionId }).toArray((err, result) => {
      if (err) throw err;
      // console.log(result)
      if (result === undefined) {
         res.send(JSON.stringify("Intruder detected - ACCESS DENIED!"))
      }
   })

   //GET MESSAGES FROM REMOTE SERVER MESSAGES COLLECTION
   messagesCollection.find({}).toArray((err, result) => {
      if (err) throw err;
      // console.log("Messages from db: ", result)
      res.send(JSON.stringify(result.slice(-20)))
   })

})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/delete-messages", function (req, res) {

   let sessionId = req.cookies.sid
   let currentUsername = sessions[sessionId]
   messages = messages.filter(message => {
      return message.username !== currentUsername
   })
   res.send(JSON.stringify({ success: true }))
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/clear-all-messages", function (req, res) {

   messagesCollection.remove({}, (err, result) => {
      if (err) throw err;
      console.log("DB: Removing all messages from messages collection on remote database!")
   })
   res.send(JSON.stringify({ success: true }))
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/newmessage", upload.none(), (req, res) => {
   let sessionId = req.cookies.sid
   let msg = req.body.msg
   let timeStamp = req.body.timeStamp

   sessionsCollection.find({ sessionId: sessionId }).toArray((err, result) => {
      if (err) throw err;
      let username = result[0].username

      if (req.body.type === "login") {
         let newMsg = { username: "SYSTEM", message: msg, timeStamp: timeStamp }
         messagesCollection.insertOne(newMsg, (err, result) => {
            if (err) throw err;
            console.log("DB: Successfully added entry to messages collection in remote database!")
            res.send(JSON.stringify({ success: true }))
         })
         return
      }

      let newMsg = { username: username, message: msg, timeStamp: timeStamp }
      messagesCollection.insertOne(newMsg, (err, result) => {
         if (err) throw err;
         console.log("DB: Successfully added entry to messages collection in remote database!")
         res.send(JSON.stringify({ success: true }))
      })
   })

})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/login", upload.none(), (req, res) => {

   let username = req.body.username
   let enteredPassword = req.body.password
   let expectedPassword /* = passwords[username]*/
   console.log(`Logging in user ${username}...`)
   //GET EXPECTED PASSWORD FROM REMOTE DATABASE
   passwordsCollection.find({ username: username }).toArray((err, result) => {

      if (result[0] === undefined) {
         console.log("User doesn't exist!")
         res.send(JSON.stringify({ success: false }))
         return
      }
      console.log("Expected password:", result[0].password)
      console.log("Password entered:", enteredPassword)

      expectedPassword = result[0].password
      //CHECK THAT IT MATCHES PASSWORD SUPPLIED BY USER
      if (enteredPassword !== expectedPassword) {
         console.log("Password doesn't match!")
         res.send(JSON.stringify({ success: false }))
         return
      }

      let sessionId = generateId()
      //Add to remote sessions collection
      sessionsCollection.insertOne({ sessionId: sessionId, username: username }, (err, result) => {
         if (err) throw err;
         console.log("DB: Successfully added entry to sessions collection in remote database!")
      })

      res.cookie('sid', sessionId);
      res.send(JSON.stringify({ success: true }))
   })
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/signup", upload.none(), (req, res) => {

   let username = req.body.username
   let enteredPassword = req.body.password
   console.log(`Signing up new user ${username}...`)
   //CHECK REMOTE PASSWORDS COLLECTION TO SEE IF USERNAME IS ALREADY TAKEN
   passwordsCollection.find({ username: username }).toArray((err, result) => {
      if (err) throw err;
      if (result[0] !== undefined) {
         console.log("Username already taken!")
         res.send(JSON.stringify({ success: false }))
         return
      }
      //ADD ENTRY TO PASSWORDS COLLECTION IN REMOTE DB
      passwordsCollection.insert({ username: username, password: enteredPassword }, (err, result) => {
         if (err) throw err;
         console.log("DB: Successfully added entry to passwords collection in remote database!")
      })
      res.send(JSON.stringify({ success: true }))
   })
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SOCKET IO STUFF

io.on("connection", socket => {

   console.log("Socket: Connected to client")

   const sessionId = socket.request.headers.cookie.sid
   console.log("Socket: Cookie from client request", sessionId)

   socket.on("send-new-message", newMessage => {

      // sessionsCollection.find({ sessionId: sessionId }).toArray((err, result) => {
      //    if (err) throw err;
      //    let username = result[0].username

      //    if (req.body.type === "login") {

      //       let newMsg = { username: "SYSTEM", message: newMessage, timeStamp: timeStamp }

      //       messagesCollection.insertOne(newMsg, (err, result) => {
      //          if (err) throw err;
      //          console.log("DB: Successfully added entry to messages collection in remote database!")
      //       })
      //       return
      //    }

      let newMsg = { username: "socket", message: newMessage, timeStamp: "12:00:00" /*timeStamp*/ }
      messagesCollection.insertOne(newMsg, (err, result) => {
         if (err) throw err;
         console.log("DB: Successfully added entry to messages collection in remote database!")

         messagesCollection.find().toArray((err, result) => {
            if (err) throw err;
            io.emit("new-messages", result)
         })
      })
      // })
   })

   socket.on("disconnect", () => {
      console.log("Socket: Client disconnected")
   })

})



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//USE WITH REMOTE SERVER! 
// app.listen(4000, "0.0.0.0", () => {
//    console.log("Running on port 4000 , 0.0.0.0")
// })

//USE WITH LOCAL SERVER!
http.listen(4000, () => {
   console.log("Running on port 4000")
})

let generateId = () => {
   return "" + Math.floor(Math.random() * 100000000)
}
