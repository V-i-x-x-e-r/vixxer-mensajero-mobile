import { useEffect, useState } from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { obtenerMedia } from "../lib/mediaRemota";
import { leerCache } from "../lib/mediaCache";

export function AdjuntoAudio({ media, color })
{
  const [uri, setUri] = useState(() => media.local || leerCache(media.path) || null);
  const player = useAudioPlayer(null);
  const estado = useAudioPlayerStatus(player);

  useEffect(() =>
  {
    if (uri)
    {
      return;
    }
    let activo = true;
    obtenerMedia({ ...media, mime: media.mime || "audio/m4a" })
      .then((final) => activo && setUri(final))
      .catch(() => {});
    return () => { activo = false; };
  }, [media.path]);

  useEffect(() =>
  {
    if (uri)
    {
      player.replace(uri);
    }
  }, [uri]);

  function alternar()
  {
    if (!uri)
    {
      return;
    }
    if (estado && estado.playing)
    {
      player.pause();
    }
    else
    {
      player.seekTo(0);
      player.play();
    }
  }

  return (
    <Pressable onPress={alternar} style={estilos.fila}>
      {!uri ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={{ color, fontSize: 18 }}>{estado && estado.playing ? "❚❚" : "▶"}</Text>
      )}
      <Text style={{ color, fontSize: 14 }}>Audio</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4, minWidth: 120 },
});
