import { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { claro, oscuro, colorido } from "../assets/themes/temas";
import { guardar, leer } from "../lib/storage";

const CLAVE = "vixxer_tema";
const Contexto = createContext(null);
const paletas = { claro, oscuro, colorido };

export function ProveedorTema({ children })
{
  const [nombre, setNombre] = useState(Appearance.getColorScheme() === "dark" ? "oscuro" : "claro");

  useEffect(() =>
  {
    leer(CLAVE).then((v) =>
    {
      if (paletas[v])
      {
        setNombre(v);
      }
    });
  }, []);

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

  const colores = paletas[nombre];
  const coloresAuth = nombre === "colorido" ? claro : colores;

  return (
    <Contexto.Provider value={{ oscuro: nombre === "oscuro", nombre, colores, coloresAuth, alternar, elegirTema }}>
      {children}
    </Contexto.Provider>
  );
}

export function useTema()
{
  return useContext(Contexto);
}
