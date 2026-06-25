import { useEffect, useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { encodeBase64 } from "tweetnacl-util";
import * as api from "../lib/api";
import { descifrarArchivo } from "../lib/crypto";

export function Adjunto({ media, color })
{
  const [uri, setUri] = useState(null);
  const [error, setError] = useState(false);

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
        if (activo && claro)
        {
          setUri(`data:${media.mime};base64,${claro}`);
        }
        else if (activo)
        {
          setError(true);
        }
      }
      catch (e)
      {
        if (activo)
        {
          setError(true);
        }
      }
    })();
    return () => { activo = false; };
  }, [media.path]);

  if (uri)
  {
    return <Image source={{ uri }} style={estilos.imagen} resizeMode="cover" />;
  }

  return (
    <View style={estilos.cargando}>
      {!error ? <ActivityIndicator color={color} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  imagen: { width: 210, height: 260, borderRadius: 12 },
  cargando: { width: 210, height: 260, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
