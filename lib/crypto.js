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

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generarCodigoRecuperacion()
{
  const bytes = ExpoCrypto.getRandomBytes(20);
  let texto = "";
  for (let i = 0; i < bytes.length; i++)
  {
    texto += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return texto.match(/.{1,4}/g).join("-");
}

function normalizarCodigo(codigo)
{
  return (codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function derivarClave(codigo, salt)
{
  return nacl.hash(decodeUTF8(normalizarCodigo(codigo) + salt)).slice(0, 32);
}

export function crearRespaldo(secretKeyBase64, codigo)
{
  const salt = encodeBase64(nacl.randomBytes(16));
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const cifrado = nacl.secretbox(decodeBase64(secretKeyBase64), nonce, derivarClave(codigo, salt));
  return { cifrado: encodeBase64(cifrado), nonce: encodeBase64(nonce), salt };
}

export function abrirRespaldo(respaldo, codigo)
{
  if (!respaldo || !respaldo.cifrado)
  {
    return null;
  }
  const abierto = nacl.secretbox.open(
    decodeBase64(respaldo.cifrado),
    decodeBase64(respaldo.nonce),
    derivarClave(codigo, respaldo.salt),
  );
  return abierto ? encodeBase64(abierto) : null;
}

export async function crearIdentidad()
{
  const par = nacl.box.keyPair();
  const publicKey = encodeBase64(par.publicKey);
  const secretKey = encodeBase64(par.secretKey);
  await guardar(CLAVE_PRIVADA, secretKey);
  await guardar(CLAVE_PUBLICA, publicKey);
  const codigo = generarCodigoRecuperacion();
  return { publicKey, codigo, respaldo: crearRespaldo(secretKey, codigo) };
}

export async function restaurarDeRespaldo(respaldo, codigo)
{
  const secretKey = abrirRespaldo(respaldo, codigo);
  if (!secretKey)
  {
    return null;
  }
  const par = nacl.box.keyPair.fromSecretKey(decodeBase64(secretKey));
  const publicKey = encodeBase64(par.publicKey);
  await guardar(CLAVE_PRIVADA, secretKey);
  await guardar(CLAVE_PUBLICA, publicKey);
  return publicKey;
}

export function numeroSeguridad(publicaA, publicaB)
{
  if (!publicaA || !publicaB)
  {
    return null;
  }
  const ordenadas = [publicaA, publicaB].sort();
  const juntas = new Uint8Array([...decodeBase64(ordenadas[0]), ...decodeBase64(ordenadas[1])]);
  const hash = nacl.hash(juntas);
  let digitos = "";
  for (let i = 0; i < 30; i++)
  {
    digitos += (hash[i] % 10).toString();
  }
  return digitos.match(/.{1,5}/g).join(" ");
}

export function cifrarArchivo(base64Archivo)
{
  const bytes = decodeBase64(base64Archivo);
  const clave = nacl.randomBytes(nacl.secretbox.keyLength);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const cifrado = nacl.secretbox(bytes, nonce, clave);
  return { datos: encodeBase64(cifrado), clave: encodeBase64(clave), nonce: encodeBase64(nonce) };
}

export function descifrarArchivo(datosBase64, claveBase64, nonceBase64)
{
  const abierto = nacl.secretbox.open(decodeBase64(datosBase64), decodeBase64(nonceBase64), decodeBase64(claveBase64));
  return abierto ? encodeBase64(abierto) : null;
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
