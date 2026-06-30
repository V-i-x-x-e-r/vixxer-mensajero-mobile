import nacl from "tweetnacl";
import { encodeBase64, decodeUTF8 } from "tweetnacl-util";
import { guardar, leer, borrar } from "./storage";

const PIN = "vixxer_pin";

function hash(pin)
{
  return encodeBase64(nacl.hash(decodeUTF8("vx-pin-" + pin)));
}

export async function tienePin()
{
  return !!(await leer(PIN));
}

export async function guardarPin(pin)
{
  await guardar(PIN, hash(pin));
}

export async function verificarPin(pin)
{
  const guardado = await leer(PIN);
  return !!guardado && guardado === hash(pin);
}

export async function quitarPin()
{
  await borrar(PIN);
}
