import React, { Component } from "react"
import { connect } from "react-redux"

class UnconnectedSignup extends Component {
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
      fetch("http://localhost:4000/signup", {
         method: "POST",
         body: data
      })
         .then(x => { return x.text() })
         .then(responseBody => {
            console.log("responseBody from signup", responseBody)
            let body = JSON.parse(responseBody)
            if (!body.success) {
               alert("Signup failed! Try something original...")
               return
            }
            console.log("parsed body", body)

            let loginData = new FormData()
            loginData.append("username", this.state.username)
            loginData.append("password", this.state.password)
            fetch("http://localhost:4000/login", {
               method: "POST",
               body: loginData,
               credentials: "include"
            })
               .then(x => { return x.text() })
               .then(responseBody => {
                  this.props.dispatch({
                     type: "login-success",
                     user: this.state.username
                  })
                  console.log("User signed up and logged in!")
               })
         })
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

let Signup = connect()(UnconnectedSignup)

export default Signup 
