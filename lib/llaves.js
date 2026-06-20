// lib/llaves.js — LÓGICA (Paola)
// Caché de llaves públicas de contactos: pedirlas al backend una sola vez por usuario
// (no en cada mensaje). La pública no es secreta, así que cachearla es seguro.

import { llavePublica } from "./api";

const cache = {};

export async function llavePublicaDe(userId) {
  if (cache[userId]) return cache[userId];
  const { llave_publica } = await llavePublica(userId);
  cache[userId] = llave_publica;
  return llave_publica;
}
