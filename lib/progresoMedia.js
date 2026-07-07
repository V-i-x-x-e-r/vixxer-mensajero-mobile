const progresos = new Map();
const oyentes = new Map();

export function publicarProgreso(id, valor)
{
  progresos.set(id, valor);
  const set = oyentes.get(id);
  if (set)
  {
    for (const cb of set)
    {
      cb(valor);
    }
  }
}

export function limpiarProgreso(id)
{
  progresos.delete(id);
  oyentes.delete(id);
}

export function alProgreso(id, cb)
{
  if (!oyentes.has(id))
  {
    oyentes.set(id, new Set());
  }
  oyentes.get(id).add(cb);
  if (progresos.has(id))
  {
    cb(progresos.get(id));
  }
  return () => oyentes.get(id)?.delete(cb);
}
