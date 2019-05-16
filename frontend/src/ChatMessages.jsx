import React, { Component } from "react"
import { connect } from "react-redux"

import { ipAddress } from './data.js'

import socket from "./SocketSettings.jsx"

let updater;

class UnconnectedChatMessages extends Component {

   componentDidMount = () => {

      //Fetch on interval to retrieve messages

      // let updater = () => {

      //    fetch(ipAddress + "/messages", {
      //       method: "GET",
      //       credentials: "include"
      //    })
      //       .then(response => { return response.text() })
      //       .then(responseBody => {
      //          // console.log("response from messages", responseBody)
      //          let parsed = JSON.parse(responseBody)
      //          // console.log("parsed", parsed)

      //          this.props.dispatch({
      //             type: "set-messages",
      //             messages: parsed
      //          })
      //       })
      // }

      // this.updateInterval = setInterval(updater, 500)

      //Socket IO retrieving messages 

      socket.open()

      socket.on("new-messages", messages => {
         console.log("Socket: Receiving messages from server: ", messages)
         this.props.dispatch({
            type: "set-messages",
            messages: messages
         })
      })



   }

   componentWillUnmount = () => {
      console.log("Stop updating messages!")
      clearInterval(this.updateInterval)
   }

   render = () => {

      let msgToElement = e => (
         <li>
            <div>{e.username}:</div>
            <div>{e.message}</div>
            <div>@{e.timeStamp}</div>
         </li>
      )


      return (
         <div>
            <ul>{this.props.messages.map(msgToElement)}</ul>
         </div>)
   }

   componentWillUnmount = () => {
      socket.close()
   }

}
let mapStateToProps = state => {
   return {
      messages: state.msgs,
      loggedInProp: state.loggedIn
   }
}



let Chat = connect(mapStateToProps)(UnconnectedChatMessages)

export default Chat 
