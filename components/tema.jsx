import { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { claro, oscuro, colorido } from "../assets/themes/temas";
import { guardar, leer } from "../lib/storage";

const CLAVE = "vixxer_tema";
const CLAVE_ACENTO = "vixxer_tema_acento";
const Contexto = createContext(null);
const paletas = { claro, oscuro, colorido };

export const ACENTOS = ["#14B8A6", "#3B82F6", "#6C5CE7", "#F43F5E", "#F59E0B", "#22C55E"];

export function ProveedorTema({ children })
{
  const [nombre, setNombre] = useState(Appearance.getColorScheme() === "dark" ? "oscuro" : "claro");
  const [acento, setAcento] = useState(ACENTOS[0]);

  useEffect(() =>
  {
    leer(CLAVE).then((v) =>
    {
      if (paletas[v])
      {
        setNombre(v);
      }
    });
    leer(CLAVE_ACENTO).then((v) =>
    {
      if (v && ACENTOS.includes(v))
      {
        setAcento(v);
      }
    });
  }, []);

  function elegirAcento(nuevo)
  {
    if (!ACENTOS.includes(nuevo))
    {
      return;
    }
    setAcento(nuevo);
    guardar(CLAVE_ACENTO, nuevo);
  }

  function elegirTema(nuevo)
  {
    if (!paletas[nuevo])
    {
      return;
    }
    setNombre(nuevo);
    guardar(CLAVE, nuevo);
  }

  function alternar()
  {
    elegirTema(nombre === "oscuro" ? "claro" : "oscuro");
  }

  const colores = nombre === "colorido"
    ? { ...colorido, botonFondo: acento, bordeFoco: acento, enlace: acento }
    : paletas[nombre];
  const coloresAuth = nombre === "colorido" ? claro : colores;

  return (
    <Contexto.Provider value={{ oscuro: nombre === "oscuro", nombre, colores, coloresAuth, acento, alternar, elegirTema, elegirAcento }}>
      {children}
    </Contexto.Provider>
  );
}

export function useTema()
{
  return useContext(Contexto);
}
