import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { leer, TOKEN } from "./storage";

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

export async function asegurarSocket()
{
  if (socket)
  {
    return socket;
  }
  const token = await leer(TOKEN);
  if (!token)
  {
    return null;
  }
  return conectarSocket(token);
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
