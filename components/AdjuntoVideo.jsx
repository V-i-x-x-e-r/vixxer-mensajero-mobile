import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { obtenerMedia } from "../lib/mediaRemota";
import { leerCache, guardarCache } from "../lib/mediaCache";
import { ajustarMedida, duracionCorta } from "../lib/mediaPreview";
import { alProgreso } from "../lib/progresoMedia";
import { AnilloProgreso } from "./AnilloProgreso";
import { VisorVideo } from "./VisorVideo";

const miniaturas = new Map();

async function miniaturaDe(uri, clave)
{
  if (miniaturas.has(clave))
  {
    return miniaturas.get(clave);
  }
  const VideoThumbnails = require("expo-video-thumbnails");
  const r = await VideoThumbnails.getThumbnailAsync(uri, { time: 0 });
  miniaturas.set(clave, r.uri);
  return r.uri;
}

function Play({ tamano = 52 })
{
  return (
    <View style={[estilos.boton, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}>
      <View style={estilos.triangulo} />
    </View>
  );
}

export function AdjuntoVideo({ media, color, onMenu, seleccionando, onToggle, cuadrado })
{
  const [uri, setUri] = useState(() => media.local || leerCache(media.path) || null);
  const [poster, setPoster] = useState(() => miniaturas.get(media.path || media.local) || null);
  const [progreso, setProgreso] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  async function abrirVideo()
  {
    if (seleccionando)
    {
      onToggle?.();
      return;
    }
    if (uri && !subiendo)
    {
      setAbierto(true);
      return;
    }
    if (descargando || subiendo)
    {
      return;
    }
    setDescargando(true);
    setProgreso(0);
    obtenerMedia(media, setProgreso)
      .then((final) =>
      {
        guardarCache(media.path, final);
        setUri(final);
        setAbierto(true);
      })
      .catch(() => {})
      .finally(() => setDescargando(false));
  }

  useEffect(() =>
  {
    if (!uri || poster)
    {
      return;
    }
    let activo = true;
    miniaturaDe(uri, media.path || media.local)
      .then((t) => activo && setPoster(t))
      .catch(() => {});
    return () => { activo = false; };
  }, [uri]);

  useEffect(() =>
  {
    if (!media.pid)
    {
      return;
    }
    return alProgreso(media.pid, setProgreso);
  }, [media.pid]);

  const marco = cuadrado
    ? { width: cuadrado, height: cuadrado, borderRadius: 10 }
    : ajustarMedida(media.w, media.h, 240, 300) || { width: 240, height: 300 };
  const subiendo = media.pid && progreso != null && progreso < 1;
  const ocupado = descargando || subiendo;
  const dur = duracionCorta(media.dur);

  return (
    <>
      <Pressable
        ref={ref}
        onPress={abrirVideo}
        onLongPress={() => ref.current?.measureInWindow((x, y, w, h) => onMenu?.({ x, y, w, h }))}
        delayLongPress={200}
        style={[estilos.miniatura, marco]}
      >
        <Image
          source={poster ? { uri: poster } : null}
          placeholder={media.prev ? { uri: media.prev } : null}
          placeholderContentFit="cover"
          contentFit="cover"
          transition={180}
          style={estilos.llena}
        />
        <View style={estilos.capa} pointerEvents="none">
          {ocupado ? <AnilloProgreso progreso={progreso} color="#fff" /> : <Play tamano={cuadrado ? 30 : 52} />}
        </View>
        {dur && !cuadrado ? (
          <View style={estilos.duracion} pointerEvents="none">
            <Text style={estilos.duracionTxt}>{dur}</Text>
          </View>
        ) : null}
      </Pressable>
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <VisorVideo uri={uri} onCerrar={() => setAbierto(false)} />
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  miniatura: { borderRadius: 14, overflow: "hidden", backgroundColor: "#000" },
  llena: { width: "100%", height: "100%" },
  capa: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  boton: { backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  duracion:
  {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  duracionTxt: { color: "#fff", fontSize: 11 },
  triangulo:
  {
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderLeftWidth: 18,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
    marginLeft: 5,
  },
});
