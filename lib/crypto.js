import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, decodeUTF8, encodeUTF8 } from "tweetnacl-util";
import * as ExpoCrypto from "expo-crypto";
import { leer, guardar, CLAVE_PRIVADA, CLAVE_PUBLICA } from "./storage";

nacl.setPRNG((x, n) =>
{
  const aleatorio = ExpoCrypto.getRandomBytes(n);
  for (let i = 0; i < n; i++)
  {
    x[i] = aleatorio[i];
  }
});

export async function asegurarClaves()
{
  let pub = await leer(CLAVE_PUBLICA);
  if (!pub)
  {
    const par = nacl.box.keyPair();
    pub = encodeBase64(par.publicKey);
    await guardar(CLAVE_PRIVADA, encodeBase64(par.secretKey));
    await guardar(CLAVE_PUBLICA, pub);
  }
  return pub;
}

export function cifrar(texto, llavePublicaDestino, miClavePrivada)
{
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const cifrado = nacl.box(
    decodeUTF8(texto),
    nonce,
    decodeBase64(llavePublicaDestino),
    decodeBase64(miClavePrivada),
  );
  return { contenidoCifrado: encodeBase64(cifrado), nonce: encodeBase64(nonce) };
}

export function descifrar(contenidoCifrado, nonce, llavePublicaRemitente, miClavePrivada)
{
  const abierto = nacl.box.open(
    decodeBase64(contenidoCifrado),
    decodeBase64(nonce),
    decodeBase64(llavePublicaRemitente),
    decodeBase64(miClavePrivada),
  );
  return abierto ? encodeUTF8(abierto) : null;
}
