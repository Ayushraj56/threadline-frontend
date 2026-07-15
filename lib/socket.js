import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket;

// Reuse a single connection across the app instead of reconnecting
// every time a component mounts.
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      withCredentials: true, // sends the httpOnly "token" cookie for auth
      autoConnect: false,
    });
  }
  return socket;
}