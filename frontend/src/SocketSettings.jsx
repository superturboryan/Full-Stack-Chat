import io from "socket.io-client";
import { Manager } from "socket.io-client";

const socket = io("http://localhost:4000", {
   autoConnect: true
});

export default socket;
