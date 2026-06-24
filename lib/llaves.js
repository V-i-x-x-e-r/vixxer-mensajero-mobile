import { llavePublica } from "./api";

const cache = {};

export async function llavePublicaDe(userId)
{
  if (cache[userId])
  {
    return cache[userId];
  }
  const { llave_publica } = await llavePublica(userId);
  cache[userId] = llave_publica;
  return llave_publica;
}
