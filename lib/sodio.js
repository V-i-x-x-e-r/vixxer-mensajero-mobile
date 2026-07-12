let sodio = null;

try
{
  const modulo = require("react-native-libsodium");
  const s = modulo && (modulo.default || modulo);
  if (s && typeof s.crypto_secretbox_easy === "function" && typeof s.crypto_secretbox_open_easy === "function")
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

const base64Nativo = !!(sodio && typeof sodio.to_base64 === "function" && sodio.base64_variants);

export function aBase64Rapido(bytes)
{
  return base64Nativo ? sodio.to_base64(bytes, sodio.base64_variants.ORIGINAL) : null;
}

export function deBase64Rapido(texto)
{
  return base64Nativo ? sodio.from_base64(texto, sodio.base64_variants.ORIGINAL) : null;
}
