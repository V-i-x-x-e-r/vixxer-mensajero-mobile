import { router } from "expo-router";
import { API_URL } from "./config";
import { leer, cerrarSesion, TOKEN } from "./storage";

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
  try
  {
    return await pedir(ruta, {
      ...opciones,
      headers: { ...(opciones.headers || {}), Authorization: `Bearer ${token}` },
    });
  }
  catch (e)
  {
    if (e.status === 401)
    {
      await cerrarSesion();
      router.replace("/");
    }
    throw e;
  }
}

export function login(usuario, contrasena)
{
  return pedir("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  });
}

export function registrar(usuario, contrasena, llave_publica, llave_firma)
{
  return pedir("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena, llave_publica, llave_firma }),
  });
}

export function cambiarContrasena(actual, nueva)
{
  return conAuth("/api/auth/cambiar-contrasena", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actual, nueva }),
  });
}

export function llavePublica(userId)
{
  return conAuth(`/api/usuarios/${userId}/llave-publica`);
}

export function actualizarLlavePublica(llave_publica)
{
  return conAuth("/api/usuarios/llave-publica", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ llave_publica }),
  });
}

export function actualizarLlaveFirma(llave_firma)
{
  return conAuth("/api/usuarios/llave-firma", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ llave_firma }),
  });
}

export function guardarPushToken(token, plataforma)
{
  return conAuth("/api/usuarios/push-token", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, plataforma }),
  });
}

export function crearGrupo(nombre, miembros)
{
  return conAuth("/api/grupos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, miembros }),
  });
}

export function misGrupos()
{
  return conAuth("/api/grupos");
}

export function infoGrupo(grupoId)
{
  return conAuth(`/api/grupos/${grupoId}`);
}

export function historialGrupo(grupoId, antes)
{
  const q = antes ? `?antes=${encodeURIComponent(antes)}` : "";
  return conAuth(`/api/grupos/${grupoId}/historial${q}`);
}

export function salirGrupo(grupoId)
{
  return conAuth(`/api/grupos/${grupoId}/salir`, { method: "POST" });
}

export function renombrarGrupo(grupoId, nombre)
{
  return conAuth(`/api/grupos/${grupoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre }),
  });
}

export function avatarGrupo(grupoId, imagen, tipo)
{
  return conAuth(`/api/grupos/${grupoId}/avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagen, tipo }),
  });
}

export function agregarMiembros(grupoId, miembros)
{
  return conAuth(`/api/grupos/${grupoId}/miembros`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ miembros }),
  });
}

export function expulsarMiembro(grupoId, userId)
{
  return conAuth(`/api/grupos/${grupoId}/miembros/${userId}`, { method: "DELETE" });
}

export function cambiarRol(grupoId, userId, rol)
{
  return conAuth(`/api/grupos/${grupoId}/rol`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, rol }),
  });
}

export function enviarGrupo(grupoId, cliente_id, cifrados, respuesta_a)
{
  return conAuth(`/api/grupos/${grupoId}/mensajes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cliente_id, cifrados, respuesta_a: respuesta_a || null }),
  });
}

export function reaccionarGrupo(grupoId, mensajeId, emoji)
{
  return conAuth(`/api/grupos/${grupoId}/mensajes/${mensajeId}/reaccion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
}

export function borrarMensajeGrupo(grupoId, mensajeId)
{
  return conAuth(`/api/grupos/${grupoId}/mensajes/${mensajeId}`, { method: "DELETE" });
}

export function editarMensajeGrupo(grupoId, mensajeId, cifrados)
{
  return conAuth(`/api/grupos/${grupoId}/mensajes/${mensajeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cifrados }),
  });
}

export function relayMensaje(sobre)
{
  return conAuth("/api/mensajes/relay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      remitente_id: sobre.remitenteId,
      destinatario_id: sobre.destinatarioId,
      contenido_cifrado: sobre.contenidoCifrado,
      nonce: sobre.nonce,
      cliente_id: sobre.id,
      firma: sobre.firma,
    }),
  });
}

export function subirRespaldo(respaldo)
{
  return conAuth("/api/usuarios/respaldo", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(respaldo),
  });
}

export function obtenerRespaldo()
{
  return conAuth("/api/usuarios/respaldo");
}

export function historial(otroId, antes)
{
  const cola = antes ? `?antes=${encodeURIComponent(antes)}` : "";
  return conAuth(`/api/mensajes/historial/${otroId}${cola}`);
}

export function limpiarConversacion(otroId)
{
  return conAuth(`/api/mensajes/conversacion/${otroId}`, { method: "DELETE" });
}

export function eliminarAmigo(otroId)
{
  return conAuth(`/api/amigos/${otroId}`, { method: "DELETE" });
}

export function bloquear(userId)
{
  return conAuth("/api/amigos/bloquear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
}

export function bloqueados()
{
  return conAuth("/api/amigos/bloqueados");
}

export function desbloquear(userId)
{
  return conAuth("/api/amigos/desbloquear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
}

export function conversaciones()
{
  return conAuth("/api/mensajes/conversaciones");
}

export function presencia(userId)
{
  return conAuth(`/api/usuarios/${userId}/presencia`);
}

export function preferencias()
{
  return conAuth("/api/usuarios/preferencias");
}

export function actualizarPreferencias(datos)
{
  return conAuth("/api/usuarios/preferencias", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

export function subirMedia(datos)
{
  return conAuth("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datos }),
  });
}

export function urlMedia(path)
{
  return conAuth(`/api/media/url?path=${encodeURIComponent(path)}`);
}

export function subirAvatar(imagen, tipo)
{
  return conAuth("/api/usuarios/avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagen, tipo }),
  });
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
