import React, { Component } from "react"
import { connect } from "react-redux"
import Login from './Login.jsx'
import Signup from './Signup.jsx'
import ChatMessages from './ChatMessages.jsx'
import ChatForm from './ChatForm.jsx'

import { ipAddress } from './data.js'

class UnconnectedApp extends Component {

   componentDidMount = () => {
      this.checkLoggedInStatus()
   }

   render = () => {

      if (this.props.loggedInProp) {
         return (
            <div>
               <div>Current user: {this.props.currentUserProp}</div>
               <button onClick={this.handleSignout}>Sign out!</button>
               <ChatMessages />
               <ChatForm />
               <button onClick={this.handleDelete}> Delete my messages! </button>
               <button onClick={this.handleDeleteAllMessages}> Delete all the messages! </button>
            </div>)
      }
      return (
         <div>
            <h1>Signup</h1>
            <Signup />
            <h1>Login</h1>
            <Login />
         </div>)
   }

   handleSignout = () => {
      this.props.dispatch({ type: "signout" })
      fetch(ipAddress + "/signout", {
         method: "GET",
         credentials: "include"
      })
   }

   handleDelete = () => {
      fetch(ipAddress + "/delete-messages", {
         method: "GET",
         credentials: "include"
      })
   }

   handleDeleteAllMessages = () => {
      fetch(ipAddress + "/clear-all-messages")
   }

   checkLoggedInStatus = () => {
      fetch(ipAddress + "/check-logged-in-status", {
         method: "GET",
         credentials: "include"
      })
         .then(x => { return x.text() })
         .then(responseBody => {
            let body = JSON.parse(responseBody)
            if (!body.success) {
               console.log("No cookie found, did not auto-login")
               return
            }
            this.props.dispatch({
               type: "login-success",
               user: body.user
            })
         })
   }

}
let mapStateToProps = state => {
   return {
      currentUserProp: state.currentUser,
      loggedInProp: state.loggedIn
   }
}
let App = connect(mapStateToProps)(UnconnectedApp)
export default App 
