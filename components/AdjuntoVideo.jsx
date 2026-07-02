import { useEffect, useRef, useState } from "react";
import { View, Pressable, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "../lib/api";
import { descifrarArchivo } from "../lib/crypto";
import { escribirTemp } from "../lib/archivos";
import { leerCache, guardarCache } from "../lib/mediaCache";
import { VisorVideo } from "./VisorVideo";

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
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const player = useVideoPlayer(null, (p) =>
  {
    p.loop = false;
    p.muted = true;
  });

  useEffect(() =>
  {
    if (media.local || uri)
    {
      return;
    }
    let activo = true;
    (async () =>
    {
      try
      {
        const { url } = await api.urlMedia(media.path);
        const resp = await fetch(url);
        const bytes = new Uint8Array(await resp.arrayBuffer());
        const claro = descifrarArchivo(encodeBase64(bytes), media.k, media.n);
        if (claro)
        {
          const archivo = await escribirTemp(claro, "mp4");
          guardarCache(media.path, archivo);
          if (activo)
          {
            setUri(archivo);
          }
        }
      }
      catch (e)
      {
      }
    })();
    return () => { activo = false; };
  }, [media.path]);

  useEffect(() =>
  {
    if (uri)
    {
      player.replace(uri);
    }
  }, [uri]);

  const dimCuadrado = cuadrado ? { width: cuadrado, height: cuadrado, borderRadius: 10 } : null;

  if (!uri)
  {
    return (
      <View style={[estilos.caja, dimCuadrado]}>
        <ActivityIndicator color={color} />
      </View>
    );
  }

  return (
    <>
      <Pressable
        ref={ref}
        onPress={() => (seleccionando ? onToggle?.() : setAbierto(true))}
        onLongPress={() => ref.current?.measureInWindow((x, y, w, h) => onMenu?.({ x, y, w, h }))}
        delayLongPress={250}
        style={[estilos.miniatura, dimCuadrado]}
      >
        <VideoView player={player} style={estilos.video} contentFit="cover" nativeControls={false} pointerEvents="none" />
        <View style={estilos.capa} pointerEvents="none">
          <Play tamano={cuadrado ? 30 : 52} />
        </View>
      </Pressable>
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <VisorVideo uri={uri} onCerrar={() => setAbierto(false)} />
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  miniatura: { width: 240, height: 300, borderRadius: 14, overflow: "hidden" },
  video: { width: "100%", height: "100%", backgroundColor: "#000" },
  caja: { width: 240, height: 300, borderRadius: 14, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  capa: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  boton: { backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
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
