const BARRAS = 44;

function percentil(lista, p)
{
  if (lista.length === 0)
  {
    return 0;
  }
  const ordenada = lista.slice().sort((a, b) => a - b);
  const idx = Math.min(ordenada.length - 1, Math.max(0, Math.floor((ordenada.length - 1) * p)));
  return ordenada[idx];
}

function energia(db)
{
  const limpio = Math.min(-1, Math.max(-70, db));
  return Math.pow(10, limpio / 35);
}

export function normalizarMuestras(muestras, n = BARRAS)
{
  if (!muestras || muestras.length === 0)
  {
    return null;
  }
  const validas = muestras.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (validas.length === 0)
  {
    return null;
  }
  const paso = validas.length / n;
  const crudos = [];
  for (let i = 0; i < n; i += 1)
  {
    const inicio = Math.floor(i * paso);
    const fin = Math.max(Math.floor((i + 1) * paso), inicio + 1);
    const trozo = validas.slice(inicio, fin).map(energia).sort((a, b) => b - a);
    const fuerte = trozo.slice(0, Math.max(1, Math.ceil(trozo.length * 0.45)));
    crudos.push(fuerte.reduce((a, b) => a + b, 0) / fuerte.length);
  }
  const bajo = percentil(crudos, 0.12);
  const alto = percentil(crudos, 0.94);
  if (!(alto - bajo > 0.01))
  {
    return new Array(n).fill(0.08);
  }
  const normal = crudos.map((v) => Math.min(1, Math.max(0, (v - bajo) / (alto - bajo))));
  const suaves = normal.map((v, i) =>
  {
    const a = normal[i - 2] ?? v;
    const b = normal[i - 1] ?? v;
    const c = normal[i + 1] ?? v;
    const d = normal[i + 2] ?? v;
    return a * 0.08 + b * 0.22 + v * 0.4 + c * 0.22 + d * 0.08;
  });
  return suaves.map((v) => Math.round((0.12 + 0.88 * Math.pow(v, 0.72)) * 100) / 100);
}

export function barrasDeterministas(semilla, n = BARRAS)
{
  const texto = String(semilla || "vx");
  const salida = [];
  let h = 2166136261;
  for (let i = 0; i < n; i += 1)
  {
    h ^= texto.charCodeAt(i % texto.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    salida.push(0.15 + (h % 1000) / 1250);
  }
  return salida;
}
