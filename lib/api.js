import { API_URL } from "./config";
import { leer, TOKEN } from "./storage";

async function pedir(ruta, opciones = {})
{
  let r;
  try
  {
    r = await fetch(`${API_URL}${ruta}`, opciones);
  }
  catch (e)
  {
    const err = new Error("No se pudo conectar con el backend");
    err.status = 0;
    throw err;
  }
  if (!r.ok)
  {
    const cuerpo = await r.json().catch(() => ({}));
    const err = new Error(cuerpo.detail || `Error ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return r.status === 204 ? null : r.json();
}

async function conAuth(ruta, opciones = {})
{
  const token = await leer(TOKEN);
  return pedir(ruta, {
    ...opciones,
    headers: { ...(opciones.headers || {}), Authorization: `Bearer ${token}` },
  });
}

export function login(usuario, contrasena)
{
  return pedir("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  });
}

export function registrar(usuario, contrasena, llave_publica)
{
  return pedir("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena, llave_publica }),
  });
}

export function buscarUsuarios(q)
{
  return conAuth(`/api/usuarios/buscar?q=${encodeURIComponent(q)}`);
}

export function llavePublica(userId)
{
  return conAuth(`/api/usuarios/${userId}/llave-publica`);
}

export function historial(otroId)
{
  return conAuth(`/api/mensajes/historial/${otroId}`);
}

export function miCodigo()
{
  return conAuth("/api/usuarios/mi-codigo");
}

export function usuarioPorCodigo(codigo)
{
  return conAuth(`/api/usuarios/codigo/${encodeURIComponent(codigo)}`);
}

export function amigos()
{
  return conAuth("/api/amigos");
}

export function solicitudes()
{
  return conAuth("/api/amigos/solicitudes");
}

export function solicitarAmigo(codigo)
{
  return conAuth("/api/amigos/solicitar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo }),
  });
}

export function aceptarSolicitud(id)
{
  return conAuth("/api/amigos/aceptar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export function rechazarSolicitud(id)
{
  return conAuth("/api/amigos/rechazar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}
