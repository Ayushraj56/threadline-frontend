import { io } from "socket.io-client";
import { getToken } from "./api";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      withCredentials: true,
      autoConnect: false,
    });
  }
  // The token can change between calls (e.g. after login), so refresh
  // it on the existing socket instance too.
  socket.auth = { token: getToken() };
  return socket;
}