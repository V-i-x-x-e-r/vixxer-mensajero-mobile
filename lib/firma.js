import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, decodeUTF8 } from "tweetnacl-util";
import * as ExpoCrypto from "expo-crypto";
import { leer, guardar, CLAVE_FIRMA_PRIVADA, CLAVE_FIRMA_PUBLICA } from "./storage";
import * as api from "./api";

nacl.setPRNG((x, n) =>
{
  const aleatorio = ExpoCrypto.getRandomBytes(n);
  for (let i = 0; i < n; i++)
  {
    x[i] = aleatorio[i];
  }
});

export async function asegurarLlaveFirma()
{
  let pub = await leer(CLAVE_FIRMA_PUBLICA);
  if (!pub)
  {
    const par = nacl.sign.keyPair();
    pub = encodeBase64(par.publicKey);
    await guardar(CLAVE_FIRMA_PRIVADA, encodeBase64(par.secretKey));
    await guardar(CLAVE_FIRMA_PUBLICA, pub);
  }
  return pub;
}

export async function publicarLlaveFirma()
{
  const pub = await asegurarLlaveFirma();
  await api.actualizarLlaveFirma(pub);
  return pub;
}

export function mensajeCanonico({ remitenteId, destinatarioId, contenidoCifrado, nonce, id })
{
  return `${remitenteId}|${destinatarioId}|${contenidoCifrado}|${nonce}|${id}`;
}

export async function firmar(mensaje)
{
  const secreta = await leer(CLAVE_FIRMA_PRIVADA);
  if (!secreta)
  {
    return null;
  }
  const firma = nacl.sign.detached(decodeUTF8(mensaje), decodeBase64(secreta));
  return encodeBase64(firma);
}
