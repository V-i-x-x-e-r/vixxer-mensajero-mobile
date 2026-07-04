import { llavePublica } from "./api";

const cache = {};

export function sembrarLlave(userId, llave)
{
  if (llave && !cache[userId])
  {
    cache[userId] = llave;
  }
}

export async function llavePublicaDe(userId, forzar = false)
{
  if (!forzar && cache[userId])
  {
    return cache[userId];
  }
  const { llave_publica } = await llavePublica(userId);
  cache[userId] = llave_publica;
  return llave_publica;
}
