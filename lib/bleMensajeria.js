import { crearSobre, crearVistos, procesar } from "./mesh";
import { conectarYEnviar, alRecibir } from "./ble";
import { descifrar } from "./crypto";
import { llavePublicaDe } from "./llaves";
import { leer, MI_ID, CLAVE_PRIVADA } from "./storage";
import { obtenerSocket } from "./socket";
import { leerCacheChat, guardarCacheChat } from "./chatCache";
import * as api from "./api";

const vistos = crearVistos();
const peers = new Set();
const oyentes = new Set();

export function registrarPeer(id)
{
  peers.add(id);
}

export function olvidarPeers()
{
  peers.clear();
}

export function peersConocidos()
{
  return peers.size;
}

export function alEntrante(cb)
{
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

async function difundir(sobre, excepto)
{
  const texto = JSON.stringify(sobre);
  let entregados = 0;
  for (const id of peers)
  {
    if (id === excepto)
    {
      continue;
    }
    const ok = await conectarYEnviar(id, texto);
    if (ok)
    {
      entregados += 1;
    }
  }
  return entregados;
}

export async function enviarPorCercania(destinatarioId, contenidoCifrado, nonce)
{
  const miId = await leer(MI_ID);
  const sobre = crearSobre({ remitenteId: miId, destinatarioId, contenidoCifrado, nonce });
  vistos.marcar(sobre.id);
  const entregados = await difundir(sobre, null);
  return { id: sobre.id, entregados };
}

let quitarRx = null;

export async function iniciarPuente()
{
  if (quitarRx)
  {
    return;
  }
  const miId = await leer(MI_ID);
  quitarRx = alRecibir(async (texto) =>
  {
    let sobre = null;
    try
    {
      sobre = JSON.parse(texto);
    }
    catch (e)
    {
      return;
    }
    const r = procesar(sobre, miId, vistos);
    if (r.accion === "entregar")
    {
      await entregarLocal(sobre);
      return;
    }
    if (r.accion === "reenviar")
    {
      const socket = obtenerSocket();
      if (socket && socket.connected)
      {
        api.relayMensaje(r.sobre).catch(() => {});
      }
      await difundir(r.sobre, null);
    }
  });
}

export function detenerPuente()
{
  if (quitarRx)
  {
    quitarRx();
    quitarRx = null;
  }
}

async function entregarLocal(sobre)
{
  const priv = await leer(CLAVE_PRIVADA);
  const pub = await llavePublicaDe(sobre.remitenteId).catch(() => null);
  const claro = pub ? descifrar(sobre.contenidoCifrado, sobre.nonce, pub, priv) : null;
  const mensaje = {
    id: sobre.id,
    remitente_id: sobre.remitenteId,
    contenido_cifrado: sobre.contenidoCifrado,
    nonce: sobre.nonce,
    texto: claro ?? "No se pudo descifrar (BLE)",
    enviado_en: new Date().toISOString(),
    porBle: true,
  };
  try
  {
    const cache = (await leerCacheChat(sobre.remitenteId)) || [];
    if (!cache.some((m) => m.id === mensaje.id))
    {
      await guardarCacheChat(sobre.remitenteId, [...cache, mensaje]);
    }
  }
  catch (e)
  {
  }
  for (const cb of oyentes)
  {
    cb(mensaje);
  }
}
