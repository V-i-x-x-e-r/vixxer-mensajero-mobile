import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "../lib/api";
import { descifrarArchivo } from "../lib/crypto";
import { escribirTemp } from "../lib/archivos";

export function AdjuntoVideo({ media, color })
{
  const [uri, setUri] = useState(null);
  const player = useVideoPlayer(null, (p) =>
  {
    p.loop = false;
  });

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
          const archivo = await escribirTemp(claro, "mp4");
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

  if (!uri)
  {
    return (
      <View style={estilos.caja}>
        <ActivityIndicator color={color} />
      </View>
    );
  }

  return <VideoView player={player} style={estilos.video} nativeControls />;
}

const estilos = StyleSheet.create({
  video: { width: 210, height: 260, borderRadius: 12, backgroundColor: "#000" },
  caja: { width: 210, height: 260, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
