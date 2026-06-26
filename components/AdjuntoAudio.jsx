import { useEffect, useState } from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "../lib/api";
import { descifrarArchivo } from "../lib/crypto";
import { escribirTemp } from "../lib/archivos";

export function AdjuntoAudio({ media, color })
{
  const [uri, setUri] = useState(null);
  const player = useAudioPlayer(null);
  const estado = useAudioPlayerStatus(player);

  useEffect(() =>
  {
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
          const archivo = await escribirTemp(claro, "m4a");
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
