import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as api from "../../lib/api";
import { descifrar } from "../../lib/crypto";
import { llavePublicaDe } from "../../lib/llaves";
import { leer, CLAVE_PRIVADA } from "../../lib/storage";
import { AdjuntoImagen } from "../../components/AdjuntoImagen";
import { AdjuntoVideo } from "../../components/AdjuntoVideo";
import { useTema } from "../../components/tema";
import { fuentes } from "../../assets/themes/temas";

function leerMedia(texto)
{
  if (!texto || texto[0] !== "{")
  {
    return null;
  }
  try
  {
    const obj = JSON.parse(texto);
    return obj && (obj.t === "img" || obj.t === "video") ? obj : null;
  }
  catch (e)
  {
    return null;
  }
}

export default function Multimedia()
{
  const { colores } = useTema();
  const { id } = useLocalSearchParams();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const hayMas = useRef(true);
  const corte = useRef(null);
  const ocupado = useRef(false);
  const priv = useRef(null);
  const pub = useRef(null);

  const cargarPagina = useCallback(async () =>
  {
    if (ocupado.current || !hayMas.current)
    {
      return;
    }
    ocupado.current = true;
    try
    {
      const filas = await api.historial(id, corte.current || undefined);
      if (filas.length < 50)
      {
        hayMas.current = false;
      }
      if (filas.length > 0)
      {
        corte.current = filas[0].enviado_en;
      }
      const nuevos = [];
      for (const f of filas)
      {
        try
        {
          if (!f.contenido_cifrado || f.contenido_cifrado === "BORRADO")
          {
            continue;
          }
          const claro = descifrar(f.contenido_cifrado, f.nonce, pub.current, priv.current);
          const m = leerMedia(claro);
          if (m)
          {
            nuevos.push({ id: f.id, media: m });
          }
        }
        catch (e)
        {
        }
      }
      nuevos.reverse();
      setItems((prev) => [...prev, ...nuevos]);
    }
    catch (e)
    {
    }
    ocupado.current = false;
    setCargando(false);
  }, [id]);

  useEffect(() =>
  {
    (async () =>
    {
      priv.current = await leer(CLAVE_PRIVADA);
      pub.current = await llavePublicaDe(id).catch(() => null);
      cargarPagina();
    })();
  }, [id]);

  const ancho = Dimensions.get("window").width;
  const celda = Math.floor((ancho - 16) / 3);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Stack.Screen options={{ title: "Multimedia" }} />
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        numColumns={3}
        contentContainerStyle={estilos.lista}
        columnWrapperStyle={estilos.fila}
        onEndReached={cargarPagina}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          item.media.t === "video"
            ? <AdjuntoVideo media={item.media} color={colores.muted} cuadrado={celda} />
            : <AdjuntoImagen media={item.media} color={colores.muted} cuadrado={celda} />
        )}
        ListFooterComponent={cargando ? <ActivityIndicator color={colores.muted} style={{ marginVertical: 20 }} /> : null}
        ListEmptyComponent={!cargando ? <Text style={[estilos.vacio, { color: colores.muted }]}>Aún no hay fotos ni videos en esta conversación.</Text> : null}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 4, gap: 4 },
  fila: { gap: 4 },
  vacio: { textAlign: "center", fontSize: 14, marginTop: 60, paddingHorizontal: 40, fontFamily: fuentes.media },
});
