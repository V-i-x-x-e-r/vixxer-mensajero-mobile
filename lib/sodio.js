let sodio = null;

try
{
  const modulo = require("react-native-libsodium");
  const s = modulo && (modulo.default || modulo);
  const clave = new Uint8Array(32);
  const nonce = new Uint8Array(24);
  const sellado = s.crypto_secretbox_easy(new Uint8Array([7]), nonce, clave);
  const abierto = s.crypto_secretbox_open_easy(sellado, nonce, clave);
  if (sellado && sellado.length === 17 && abierto && abierto[0] === 7)
  {
    sodio = s;
  }
}
catch (e)
{
  sodio = null;
}

export function sodioDisponible()
{
  return !!sodio;
}

export function sellarRapido(bytes, nonce, clave)
{
  return sodio.crypto_secretbox_easy(bytes, nonce, clave);
}

export function abrirRapido(caja, nonce, clave)
{
  try
  {
    return sodio.crypto_secretbox_open_easy(caja, nonce, clave);
  }
  catch (e)
  {
    return null;
  }
}

let base64Nativo = false;
try
{
  base64Nativo = !!(sodio && sodio.base64_variants &&
    sodio.to_base64(new Uint8Array([1]), sodio.base64_variants.ORIGINAL) === "AQ==" &&
    sodio.from_base64("AQ==", sodio.base64_variants.ORIGINAL)[0] === 1);
}
catch (e)
{
  base64Nativo = false;
}

export function aBase64Rapido(bytes)
{
  return base64Nativo ? sodio.to_base64(bytes, sodio.base64_variants.ORIGINAL) : null;
}

export function deBase64Rapido(texto)
{
  return base64Nativo ? sodio.from_base64(texto, sodio.base64_variants.ORIGINAL) : null;
}
