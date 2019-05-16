import React, { Component } from "react"
import { connect } from "react-redux"
import { ipAddress } from "./data";
class UnconnectedLogin extends Component {
   constructor(props) {
      super(props)
      this.state = {
         username: "",
         password: ""
      }
   }
   handleUsernameChange = event => {
      console.log("new username", event.target.value)
      this.setState({ username: event.target.value })
   }
   handlePasswordChange = event => {
      console.log("new password", event.target.value)
      this.setState({ password: event.target.value })
   }
   handleSubmit = evt => {
      evt.preventDefault()
      console.log("login form submitted")
      let data = new FormData()
      data.append("username", this.state.username)
      data.append("password", this.state.password)

      fetch(ipAddress + "/login", {
         method: "POST",
         body: data,
         credentials: "include"
      })
         .then(x => { return x.text() })
         .then(responseBody => {
            console.log("responseBody from login", responseBody)
            let body = JSON.parse(responseBody)
            console.log("parsed body", body)
            if (!body.success) {
               alert("login failed")
               return
            }
            this.props.dispatch({
               type: "login-success",
               user: this.state.username
            })
            let messageData = new FormData()
            let loginMessage = `User ${this.state.username} has logged in!`
            let timeStamp = new Date().toLocaleTimeString()
            messageData.append("timeStamp", timeStamp)
            messageData.append("msg", loginMessage)
            messageData.append("type", "login")
            fetch(ipAddress + "/newmessage", {
               method: "POST",
               body: messageData,
               credentials: "include"
            })
         })
   }
   render = () => {
      return (
         <form onSubmit={this.handleSubmit}>
            <div>Username</div>
            <div><input type="text" onChange={this.handleUsernameChange} /></div>
            <div>Password</div>
            <div><input type="text" onChange={this.handlePasswordChange} /></div>
            <div><input type="submit" /></div>
         </form >
      )
   }
}

let Login = connect()(UnconnectedLogin)
export default Login 