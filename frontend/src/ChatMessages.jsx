import React, { Component } from "react"
import { connect } from "react-redux"

class UnconnectedChatMessages extends Component {
   componentDidMount = () => {
      let updater = () => {
         fetch("http://localhost:4000/messages")
            .then(response => { return response.text() })
            .then(responseBody => {
               console.log("response from messages", responseBody)
               let parsed = JSON.parse(responseBody)
               console.log("parsed", parsed)
               this.props.dispatch({
                  type: "set-messages",
                  messages: parsed
               })
            })
      }
      setInterval(updater, 500)
   }
   render = () => {
      let msgToElement = e => <li> {e.username}:{e.message} </li> 0
      return (
         <div>
            <ul>{this.props.messages.map(msgToElement)}</ul>
         </div>)
   }
}
let mapStateToProps = state => {
   return {
      messages: state.msgs
   }
}
let Chat = connect(mapStateToProps)(UnconnectedChatMessages)
export default Chat 
