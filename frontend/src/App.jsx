import React, { Component } from "react"
import { connect } from "react-redux"
import Login from './Login.jsx'
import Signup from './Signup.jsx'
import ChatMessages from './ChatMessages.jsx'
import ChatForm from './ChatForm.jsx'

class UnconnectedApp extends Component {

   render = () => {
      if (this.props.loggedInProp) {
         return (<div>
            <div>Current user: {this.props.currentUserProp}</div>
            <button onClick={this.handleSignout}>Sign out!</button>
            <ChatMessages />
            <ChatForm />
            <button onClick={this.handleDelete}> Delete my messages! </button>
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
   }

   handleDelete = () => {
      fetch("http://localhost:4000/delete-messages", {
         method: "GET",
         credentials: "include"
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
