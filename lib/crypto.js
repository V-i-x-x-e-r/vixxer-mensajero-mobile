// lib/crypto.js — LÓGICA (Paola) · el corazón de Vixxer
// Cifrado extremo a extremo con TweetNaCl (Curve25519 + XSalsa20 + Poly1305).
// Nunca inventamos cripto: usamos NaCl (auditado). El servidor jamás ve el texto.
//
//   clave PÚBLICA  -> se sube al servidor en el registro (la usan para escribirte)
//   clave PRIVADA  -> se queda SOLO en este teléfono (con ella descifras)

import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, decodeUTF8, encodeUTF8 } from "tweetnacl-util";
import * as ExpoCrypto from "expo-crypto";
import { leer, guardar, CLAVE_PRIVADA, CLAVE_PUBLICA } from "./storage";

// TweetNaCl necesita un generador aleatorio seguro. React Native no trae
// crypto.getRandomValues por defecto, así que se lo damos con expo-crypto.
nacl.setPRNG((x, n) => {
  const aleatorio = ExpoCrypto.getRandomBytes(n);
  for (let i = 0; i < n; i++) x[i] = aleatorio[i];
});

// Genera el par de claves UNA sola vez y lo guarda. Devuelve la pública
// (la que mandas al registrarte). Si ya existe, devuelve la misma.
export async function asegurarClaves() {
  let pub = await leer(CLAVE_PUBLICA);
  if (!pub) {
    const par = nacl.box.keyPair();
    pub = encodeBase64(par.publicKey);
    await guardar(CLAVE_PRIVADA, encodeBase64(par.secretKey));
    await guardar(CLAVE_PUBLICA, pub);
  }
  return pub;
}

// Cifrar un texto para alguien: necesitas SU pública + TU privada.
// Devuelve el blob opaco + un nonce (número de un solo uso). Eso es lo único que viaja.
export function cifrar(texto, llavePublicaDestino, miClavePrivada) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const cifrado = nacl.box(
    decodeUTF8(texto),
    nonce,
    decodeBase64(llavePublicaDestino),
    decodeBase64(miClavePrivada),
  );
  return { contenidoCifrado: encodeBase64(cifrado), nonce: encodeBase64(nonce) };
}

// Descifrar lo que te llega: necesitas la pública del REMITENTE + TU privada.
// Es la operación espejo de cifrar(). Devuelve el texto, o null si no se pudo abrir.
export function descifrar(contenidoCifrado, nonce, llavePublicaRemitente, miClavePrivada) {
  const abierto = nacl.box.open(
    decodeBase64(contenidoCifrado),
    decodeBase64(nonce),
    decodeBase64(llavePublicaRemitente),
    decodeBase64(miClavePrivada),
  );
  return abierto ? encodeUTF8(abierto) : null; // null = clave equivocada o dato corrupto
}
