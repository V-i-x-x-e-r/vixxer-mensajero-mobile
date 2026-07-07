import { useEffect, useState } from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { obtenerPreview, dominioDe } from "../lib/enlaces";
import { useTema } from "./tema";
import { fuentes } from "../assets/themes/temas";

export function TarjetaEnlace({ url, claro })
{
  const { colores } = useTema();
  const [datos, setDatos] = useState(null);

  useEffect(() =>
  {
    let activo = true;
    obtenerPreview(url).then((d) => activo && setDatos(d));
    return () => { activo = false; };
  }, [url]);

  if (!datos)
  {
    return null;
  }

  const fondo = claro ? "rgba(255,255,255,0.16)" : "rgba(127,127,127,0.14)";
  const principal = claro ? "#FFF" : colores.texto;
  const secundario = claro ? "rgba(255,255,255,0.85)" : colores.muted;

  return (
    <Pressable onPress={() => Linking.openURL(datos.url).catch(() => {})} style={[estilos.tarjeta, { backgroundColor: fondo }]}>
      {datos.imagen ? (
        <Image source={{ uri: datos.imagen }} contentFit="cover" transition={150} style={estilos.imagen} />
      ) : null}
      <View style={estilos.cuerpo}>
        <Text numberOfLines={2} style={[estilos.titulo, { color: principal }]}>{datos.titulo}</Text>
        {datos.desc ? <Text numberOfLines={2} style={[estilos.desc, { color: secundario }]}>{datos.desc}</Text> : null}
        <Text numberOfLines={1} style={[estilos.dominio, { color: secundario, opacity: 0.8 }]}>{dominioDe(datos.url)}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: 12, overflow: "hidden", marginTop: 6, minWidth: 200 },
  imagen: { width: "100%", height: 120 },
  cuerpo: { padding: 9, gap: 2 },
  titulo: { fontSize: 13.5, fontFamily: fuentes.semibold },
  desc: { fontSize: 12.5 },
  dominio: { fontSize: 11.5 },
});
