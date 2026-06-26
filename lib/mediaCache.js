const cache = new Map();

export function leerCache(path)
{
  return cache.get(path);
}

export function guardarCache(path, valor)
{
  cache.set(path, valor);
}
