import { leer, guardar } from "./storage";

const CLAVE = "vixxer_llaves_pasadas";
let memoria = [];

export async function cargarLlavero()
{
  try
  {
    memoria = JSON.parse((await leer(CLAVE)) || "[]");
  }
  catch (e)
  {
    memoria = [];
  }
  return memoria;
}

export function llavesPasadas()
{
  return memoria;
}

export async function recordarLlave(privada)
{
  if (!privada || memoria.includes(privada))
  {
    return;
  }
  memoria = [privada, ...memoria].slice(0, 5);
  try
  {
    await guardar(CLAVE, JSON.stringify(memoria));
  }
  catch (e)
  {
  }
}
