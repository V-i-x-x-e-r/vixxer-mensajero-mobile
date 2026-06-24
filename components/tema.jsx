import { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { claro, oscuro } from "../assets/themes/temas";
import { guardar, leer } from "../lib/storage";

const CLAVE = "vixxer_tema";
const Contexto = createContext(null);

export function ProveedorTema({ children })
{
  const [oscuroActivo, setOscuroActivo] = useState(Appearance.getColorScheme() === "dark");

  useEffect(() =>
  {
    leer(CLAVE).then((v) =>
    {
      if (v === "claro" || v === "oscuro")
      {
        setOscuroActivo(v === "oscuro");
      }
    });
  }, []);

  function alternar()
  {
    setOscuroActivo((prev) =>
    {
      const nuevo = !prev;
      guardar(CLAVE, nuevo ? "oscuro" : "claro");
      return nuevo;
    });
  }

  const colores = oscuroActivo ? oscuro : claro;

  return (
    <Contexto.Provider value={{ oscuro: oscuroActivo, colores, alternar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useTema()
{
  return useContext(Contexto);
}
