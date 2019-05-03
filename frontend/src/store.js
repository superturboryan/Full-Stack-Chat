import { createStore } from "redux"
let reducer = (state, action) => {

   if (action.type === "login-success") {

      console.log("Current user", state.currentUser)
      return {
         ...state,
         loggedIn: true,
         currentUser: action.user
      }
   }
   if (action.type === "set-messages") {
      return {
         ...state,
         msgs: action.messages
      }
   }
   if (action.type === "signout") {
      console.log("Signing out!")
      return {
         ...state,
         loggedIn: false,
         currentUser: ""
      }
   }

   return state
}

const store = createStore(
   reducer,
   {
      msgs: [],
      loggedIn: false,
      currentUser: ""
   },
   window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

export default store 
