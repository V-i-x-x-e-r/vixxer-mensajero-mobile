// lib/socket.js — LÓGICA (Paola)
// Conexión en vivo con el backend (Socket.IO). Mantenemos UNA sola conexión
// (singleton) para toda la app: la lista de chats la abre y la pantalla de chat
// la reutiliza. Socket.IO reconecta solo; nosotros solo reflejamos el estado.
//
// Eventos del contrato:
//   emitimos  "mensaje:enviar"   { destinatarioId, contenidoCifrado, nonce }
//   recibimos "mensaje:recibido" fila guardada (snake_case) -> se descifra en el teléfono

import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

let socket = null;

// Conecta (o devuelve la conexión existente). El token va en `auth`,
// que el backend valida en su handler connect.
export function conectarSocket(token) {
  if (socket && socket.connected) return socket;
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"], // en móvil el transporte websocket es el más estable
    });
  }
  return socket;
}

export function obtenerSocket() {
  return socket;
}

export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
