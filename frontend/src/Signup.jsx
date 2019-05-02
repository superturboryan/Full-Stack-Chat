import React, { Component } from "react"
class Signup extends Component {
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
      console.log("signup form submitted")
      let data = new FormData()
      data.append("username", this.state.username)
      data.append("password", this.state.password)
      fetch("http://localhost:4000/signup",
         { method: "POST", body: data })
   }

   render = () => {
      return (
         <form onSubmit={this.handleSubmit}>
            Username
            <input type="text" onChange={this.handleUsernameChange} />
            Password
            <input type="text" onChange={this.handlePasswordChange} />
            <input type="submit" />
         </form>
      )
   }
}
export default Signup 
