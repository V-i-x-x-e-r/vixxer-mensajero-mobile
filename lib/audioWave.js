const BARRAS = 36;

export function normalizarMuestras(muestras, n = BARRAS)
{
  if (!muestras || muestras.length === 0)
  {
    return null;
  }
  const paso = muestras.length / n;
  const salida = [];
  for (let i = 0; i < n; i += 1)
  {
    const trozo = muestras.slice(Math.floor(i * paso), Math.max(Math.floor((i + 1) * paso), Math.floor(i * paso) + 1));
    const db = trozo.reduce((a, b) => a + b, 0) / trozo.length;
    const v = Math.min(1, Math.max(0.08, (db + 50) / 50));
    salida.push(Math.round(v * 100) / 100);
  }
  return salida;
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
