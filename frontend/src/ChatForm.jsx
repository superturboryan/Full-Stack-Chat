import React, { Component } from "react"

import { ipAddress } from './data.js'

import socket from "./SocketSettings.jsx"

class ChatForm extends Component {

   constructor(props) {
      super(props)
      this.state = { message: "" }
   }

   componentDidMount = () => {
      socket.open()
   }

   handleMessageChange = event => {
      console.log("new message", event.target.value)
      this.setState({ message: event.target.value })
   }

   handleSubmit = event => {
      event.preventDefault()
      console.log("form submitted")
      let data = new FormData()
      data.append("msg", this.state.message)
      data.append("type", "regular")
      let time = new Date().toLocaleTimeString()
      data.append("timeStamp", time)
      // fetch(ipAddress + "/newmessage", {
      //    method: "POST",
      //    body: data,
      //    credentials: "include"
      // })

      socket.emit("send-new-message", this.state.message)

      this.setState({ message: "" })
   }

   render = () => {
      return (
         <div>
            <form onSubmit={this.handleSubmit}>
               <input onChange={this.handleMessageChange} type="text" value={this.state.message} />
               <input type="submit" />
            </form>
         </div>)
   }
}

export default ChatForm 
