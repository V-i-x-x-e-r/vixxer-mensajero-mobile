import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, StyleSheet, Image as ImagenNativa } from "react-native";
import { Image } from "expo-image";
import { obtenerMedia } from "../lib/mediaRemota";
import { leerCache } from "../lib/mediaCache";
import { ajustarMedida } from "../lib/mediaPreview";
import { alProgreso } from "../lib/progresoMedia";
import { AnilloProgreso } from "./AnilloProgreso";
import { VisorImagen } from "./VisorImagen";

export function AdjuntoImagen({ media, color, onMenu, seleccionando, onToggle, cuadrado })
{
  const esSticker = media.t === "sticker";
  const [uri, setUri] = useState(() => media.local || leerCache(media.path) || null);
  const [dims, setDims] = useState(() => ajustarMedida(media.w, media.h));
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const [intento, setIntento] = useState(0);
  const ref = useRef(null);

  useEffect(() =>
  {
    if (uri)
    {
      return;
    }
    let activo = true;
    obtenerMedia(media, (p) => activo && setProgreso(p))
      .then((final) => activo && setUri(final))
      .catch(() => activo && setError(true));
    return () => { activo = false; };
  }, [media.path, intento]);

  useEffect(() =>
  {
    if (!media.pid)
    {
      return;
    }
    return alProgreso(media.pid, setProgreso);
  }, [media.pid]);

  useEffect(() =>
  {
    if (!uri || dims || esSticker || cuadrado)
    {
      return;
    }
    let activo = true;
    ImagenNativa.getSize(
      uri,
      (w, h) => activo && setDims(ajustarMedida(w, h)),
      () => activo && setDims({ width: 210, height: 260 }),
    );
    return () => { activo = false; };
  }, [uri, dims]);

  function reintentar()
  {
    setError(false);
    setProgreso(null);
    setIntento((n) => n + 1);
  }

  const marco = cuadrado
    ? { width: cuadrado, height: cuadrado, borderRadius: 10 }
    : esSticker
      ? estilos.sticker
      : dims || estilos.caja;
  const subiendo = media.pid && progreso != null && progreso < 1;
  const cargando = !uri && !error;

  if (!uri && !media.prev)
  {
    return (
      <View style={[estilos.caja, estilos.centro, marco]}>
        {error ? (
          <Pressable onPress={reintentar} style={estilos.centro}>
            <Text style={[estilos.reintentar, { color }]}>Reintentar</Text>
          </Pressable>
        ) : (
          <ActivityIndicator color={color} />
        )}
      </View>
    );
  }

  return (
    <>
      <Pressable
        ref={ref}
        onPress={() => (seleccionando ? onToggle?.() : error ? reintentar() : uri ? setAbierta(true) : null)}
        onLongPress={() => ref.current?.measureInWindow((x, y, w, h) => onMenu?.({ x, y, w, h }))}
        delayLongPress={250}
        style={[marco, estilos.recorte]}
      >
        <Image
          source={uri ? { uri } : null}
          placeholder={media.prev ? { uri: media.prev } : null}
          placeholderContentFit="cover"
          contentFit={esSticker && !cuadrado ? "contain" : "cover"}
          transition={180}
          style={estilos.llena}
        />
        {(cargando || subiendo) && !esSticker ? (
          <View style={estilos.capa} pointerEvents="none">
            <AnilloProgreso progreso={progreso} color="#fff" />
          </View>
        ) : null}
        {error ? (
          <View style={estilos.capa} pointerEvents="none">
            <Text style={estilos.reintentar}>Reintentar</Text>
          </View>
        ) : null}
      </Pressable>
      <Modal visible={abierta} transparent animationType="fade" onRequestClose={() => setAbierta(false)}>
        <VisorImagen uri={uri} onCerrar={() => setAbierta(false)} />
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  llena: { width: "100%", height: "100%" },
  recorte: { borderRadius: 14, overflow: "hidden" },
  sticker: { width: 150, height: 150 },
  caja: { width: 210, height: 260, borderRadius: 14 },
  centro: { alignItems: "center", justifyContent: "center" },
  capa: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  reintentar: { color: "#fff", fontSize: 13, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
});
