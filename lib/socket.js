import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

let socket = null;

export function conectarSocket(token)
{
  if (socket && socket.connected)
  {
    return socket;
  }
  if (!socket)
  {
    socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
  }
  return socket;
}

export function obtenerSocket()
{
  return socket;
}

export function desconectarSocket()
{
  if (socket)
  {
    socket.disconnect();
    socket = null;
  }
}
