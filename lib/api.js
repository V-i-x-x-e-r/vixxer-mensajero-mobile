// lib/api.js — LÓGICA (Paola)
// Cliente HTTP del backend. Centraliza fetch, el token y el manejo de errores,
// para que las pantallas solo llamen funciones limpias: login(), buscarUsuarios()...
//
// Contrato del backend (lo congela César):
//   POST /api/auth/register  { usuario, contrasena, llave_publica }      -> 201 { id, usuario }
//   POST /api/auth/login     { usuario, contrasena }                     -> 200 { token, usuario:{id,usuario} }
//   GET  /api/usuarios/buscar?q=texto            (Bearer)                -> 200 [ { id, usuario, llave_publica } ]
//   GET  /api/usuarios/:id/llave-publica         (Bearer)                -> 200 { id, llave_publica }
//   GET  /api/mensajes/historial/:otro_id        (Bearer)                -> 200 [ fila (snake_case) ]

import { API_URL } from "./config";
import { leer, TOKEN } from "./storage";

// fetch base: arma la URL, parsea JSON y convierte respuestas no-2xx en errores
// con .status, para que la pantalla muestre el mensaje correcto (401, 409, ...).
async function pedir(ruta, opciones = {}) {
  let r;
  try {
    r = await fetch(`${API_URL}${ruta}`, opciones);
  } catch (e) {
    const err = new Error("No se pudo conectar con el backend");
    err.status = 0; // 0 = fallo de red (backend caído o URL mal)
    throw err;
  }
  if (!r.ok) {
    const cuerpo = await r.json().catch(() => ({}));
    const err = new Error(cuerpo.detail || `Error ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return r.status === 204 ? null : r.json();
}

// Igual que pedir(), pero añade la cabecera Authorization con el token guardado.
async function conAuth(ruta, opciones = {}) {
  const token = await leer(TOKEN);
  return pedir(ruta, {
    ...opciones,
    headers: { ...(opciones.headers || {}), Authorization: `Bearer ${token}` },
  });
}

// ---- Auth ----
export function login(usuario, contrasena) {
  return pedir("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  });
}

export function registrar(usuario, contrasena, llave_publica) {
  return pedir("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena, llave_publica }),
  });
}

// ---- Usuarios ----
export function buscarUsuarios(q) {
  return conAuth(`/api/usuarios/buscar?q=${encodeURIComponent(q)}`);
}

export function llavePublica(userId) {
  return conAuth(`/api/usuarios/${userId}/llave-publica`);
}

// ---- Mensajes ----
export function historial(otroId) {
  return conAuth(`/api/mensajes/historial/${otroId}`);
}
