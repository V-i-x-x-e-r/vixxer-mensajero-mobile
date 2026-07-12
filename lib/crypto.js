import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, decodeUTF8, encodeUTF8 } from "tweetnacl-util";
import * as ExpoCrypto from "expo-crypto";
import { leer, guardar, CLAVE_PRIVADA, CLAVE_PUBLICA, CODIGO_RECUP } from "./storage";
import { sodioDisponible, sellarRapido, abrirRapido, aBase64Rapido, deBase64Rapido } from "./sodio";
import { llavesPasadas, recordarLlave } from "./llavero";

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
  const anterior = await leer(CLAVE_PRIVADA);
  if (anterior && anterior !== secretKey)
  {
    await recordarLlave(anterior);
  }
  await guardar(CLAVE_PRIVADA, secretKey);
  await guardar(CLAVE_PUBLICA, publicKey);
  const codigo = generarCodigoRecuperacion();
  await guardar(CODIGO_RECUP, codigo);
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
  const anterior = await leer(CLAVE_PRIVADA);
  if (anterior && anterior !== secretKey)
  {
    await recordarLlave(anterior);
  }
  await guardar(CLAVE_PRIVADA, secretKey);
  await guardar(CLAVE_PUBLICA, publicKey);
  await guardar(CODIGO_RECUP, codigo);
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
  const abierto = abrirCajaSecreta(decodificarB64(datosBase64), decodificarB64(nonceBase64), decodificarB64(claveBase64));
  return abierto ? codificarB64(abierto) : null;
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

function abrirCaja(contenidoCifrado, nonce, llavePublicaRemitente, privada)
{
  try
  {
    const abierto = nacl.box.open(
      decodeBase64(contenidoCifrado),
      decodeBase64(nonce),
      decodeBase64(llavePublicaRemitente),
      decodeBase64(privada),
    );
    return abierto ? encodeUTF8(abierto) : null;
  }
  catch (e)
  {
    return null;
  }
}

export function descifrar(contenidoCifrado, nonce, llavePublicaRemitente, miClavePrivada)
{
  const directo = abrirCaja(contenidoCifrado, nonce, llavePublicaRemitente, miClavePrivada);
  if (directo !== null)
  {
    return directo;
  }
  for (const vieja of llavesPasadas())
  {
    if (vieja === miClavePrivada)
    {
      continue;
    }
    const abierto = abrirCaja(contenidoCifrado, nonce, llavePublicaRemitente, vieja);
    if (abierto !== null)
    {
      return abierto;
    }
  }
  return null;
}

function sellarCajaSecreta(bytes, nonce, clave)
{
  return sodioDisponible() ? sellarRapido(bytes, nonce, clave) : nacl.secretbox(bytes, nonce, clave);
}

function abrirCajaSecreta(caja, nonce, clave)
{
  return sodioDisponible() ? abrirRapido(caja, nonce, clave) : nacl.secretbox.open(caja, nonce, clave);
}

function codificarB64(bytes)
{
  const rapido = aBase64Rapido(bytes);
  return rapido !== null ? rapido : encodeBase64(bytes);
}

function decodificarB64(texto)
{
  const rapido = deBase64Rapido(texto);
  return rapido !== null ? rapido : decodeBase64(texto);
}

const TROZO_B64 = 87376;
export const MAGIA_TROZOS_B64 = "VlgyQ0gx";

function nonceDeTrozo(nonceBase, indice)
{
  const n = new Uint8Array(nonceBase);
  n[20] = (indice >>> 24) & 255;
  n[21] = (indice >>> 16) & 255;
  n[22] = (indice >>> 8) & 255;
  n[23] = indice & 255;
  return n;
}

function enmarcarTrozo(sellado)
{
  const relleno = (3 - ((6 + sellado.length) % 3)) % 3;
  const marco = new Uint8Array(6 + sellado.length + relleno);
  marco[0] = (sellado.length >>> 16) & 255;
  marco[1] = (sellado.length >>> 8) & 255;
  marco[2] = sellado.length & 255;
  marco.set(sellado, 6);
  return marco;
}

export function medidaMarcoTrozo(cabecera)
{
  const len = (cabecera[0] << 16) | (cabecera[1] << 8) | cabecera[2];
  const relleno = (3 - ((6 + len) % 3)) % 3;
  return { len, salto: 6 + len + relleno };
}

export async function cifrarArchivoTrozos(base64Archivo, onProgreso)
{
  const clave = nacl.randomBytes(nacl.secretbox.keyLength);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const piezas = [MAGIA_TROZOS_B64];
  const total = Math.max(1, Math.ceil(base64Archivo.length / TROZO_B64));
  for (let i = 0; i < total; i++)
  {
    const bytes = decodificarB64(base64Archivo.slice(i * TROZO_B64, (i + 1) * TROZO_B64));
    const sellado = sellarCajaSecreta(bytes, nonceDeTrozo(nonce, i), clave);
    piezas.push(codificarB64(enmarcarTrozo(sellado)));
    if (onProgreso)
    {
      onProgreso((i + 1) / total);
    }
    if (i % 3 === 2)
    {
      await new Promise((listo) => setTimeout(listo, 0));
    }
  }
  return { datos: piezas.join(""), clave: encodeBase64(clave), nonce: encodeBase64(nonce) };
}

export function abrirTrozoArchivo(selladoBase64, claveBase64, nonceBase64, indice)
{
  const abierto = abrirCajaSecreta(
    decodificarB64(selladoBase64),
    nonceDeTrozo(decodificarB64(nonceBase64), indice),
    decodificarB64(claveBase64),
  );
  return abierto ? codificarB64(abierto) : null;
}
